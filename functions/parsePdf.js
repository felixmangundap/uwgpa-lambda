const pdf = require('pdf-parse');

const { convertGPA } = require('./convertGPA');
 
const regex = {
   courseCodeRegex: /^[A-Z]{2,5} \d{1,3}[A-Z]?(?=[A-Z])/gm,
   courseCreditRegex: /((\d{1,2}.\d{2})*)/gm,
   courseGradeRegex: /(?<=((.)\d{2}){2})(\d{1,3}|[A-Z]{1,3})/gm,
   courseNameRegex: /^[^0]*/gm,
   courseRegex: /^[A-Z]{2,5} \d{1,3}[A-Z]?(?=[A-Z]).*/gm,
   creditRegex: /\d{1,2}.\d{2}/gm,
   cumulativeCreditRegex: /(?<=(Cumulative Totals))\s*\d*[.]\d*.\d*/gm,
   cumulativeGPARegex: /(?<=(Cumulative GPA))\s*\d*[.]\d*/gm,
   dateRegex: /\d{2}(\/)\d{2}(\/)\d{4}/gm,
   headerRegex: /(University of Waterloo)(\s.*){8}\s(Ontario Education Nbr:)\s*\d{9}/gm,
   idRegex: /(?<=(Student ID:)).*/gm,
   levelRegex: /(?<=(Level:))\s*\d{1}(A|B)/gm,
   nameRegex: /(?<=(Name:)).*/gm,
   ontarioRegex: /(?<=(Ontario Education Nbr:)).*/gm,
   programRegex: /(?<=(Program:))\s*.*/gm,
   termCreditRegex: /(?<=(Term Totals))\s*\d*[.]\d*.\d*/gm,
   termGPARegex: /(?<=(Term GPA))\s*\d*[.]\d*/gm,
   termGroupRegex: /((Fall|Spring|Winter) \d{4}|Milestones)(\s(?!.*\b((Fall|Spring|Winter) \d{4}|Milestones)\b).*)*/gm,
   termRegex: /(Fall|Spring|Winter) \d{4}/gm,
   trimRegex: /( )+/gm,
}

const getStringData = (data) => {
    if (data) return data[0].trim();
    return null;
}

const getCredit = (data, type) => {
    if (!data || !data[0]) return null;
    
    const { creditRegex } = regex;
    const credits = data[0].match(creditRegex);
    if (type === 'attempted') return credits[0];
    if (type === 'earned') return credits[1];

    return null;
}

const calculateCumulativeGPA = (terms) => {
    let gpa = 0.00;
    let numberOfCourses = 0;

    terms.forEach(term => {
        const { courses } = term;

        courses.forEach(course => {
            if (course.includedInAverage) {
                numberOfCourses++;
                gpa += course.gpa;
            }
        })
    })

    gpa /= numberOfCourses;

    return gpa.toFixed(2);
}

const calculateTermGPA = (courses) => {
    let gpa = 0.00;
    let numberOfCourses = 0;

    courses.forEach(course => {
        if (course.includedInAverage) {
            numberOfCourses++;
            gpa += course.gpa;
        }
    })

    gpa /= numberOfCourses;

    return gpa.toFixed(2);
}

const parsePdf = async ( pdfData ) => {
    const data = await pdf(pdfData);
    const {
        courseCodeRegex,
        courseCreditRegex,
        courseGradeRegex,
        courseNameRegex,
        courseRegex,
        cumulativeCreditRegex,
        cumulativeGPARegex,
        termCreditRegex,
        termGPARegex,
        headerRegex,
        idRegex,
        levelRegex,
        nameRegex,
        ontarioRegex,
        programRegex,
        termGroupRegex,
        termRegex,
        trimRegex,
    } = regex;

    const terms = [];
    
    const pdfText = data.text;
    const headerData = pdfText.match(headerRegex)[0];
    
    const name = getStringData(headerData.match(nameRegex));
    const id = getStringData(headerData.match(idRegex));
    const ontarioNumber = getStringData(headerData.match(ontarioRegex));
    
    const pdfNoHeader = pdfText.replace(headerRegex, '');
    const pdfTrimmed = pdfNoHeader.replace(trimRegex, ' ').trim();
    const transcriptTerms = pdfTrimmed.match(termGroupRegex);

    let cumulativeGrade;
    
    transcriptTerms.forEach((transcriptTerm, index) => {
        
        if (index === transcriptTerms.length - 1) {
            return;
        }
        
        const termDetails = transcriptTerm.normalize();
        
        const term  = getStringData(transcriptTerm.match(termRegex));
        const program = getStringData(termDetails.match(programRegex));
        const level = getStringData(termDetails.match(levelRegex));
        
        const coursesDetails = termDetails.match(courseRegex);
        const courses = [];
        if (coursesDetails) {
            coursesDetails.forEach(courseDetails => {
                let courseInfo = courseDetails;
                const courseCode = getStringData(courseInfo.match(courseCodeRegex));
                courseInfo = courseInfo.replace(courseCode, '');
                const courseName = getStringData(courseInfo.match(courseNameRegex));
                courseInfo = courseInfo.replace(courseName, '');
                const courseCredit = courseInfo.match(courseCreditRegex);
                courseInfo = courseInfo.replace(courseCredit, '');
                const courseGrade = getStringData(courseInfo.match(courseGradeRegex));

                const gpa = convertGPA(courseGrade);
                const attemptedCredit = getCredit(courseCredit, 'attempted');
                const earnedCredit = getCredit(courseCredit, 'earned');
                const noCreditAverage = (!isNaN(Number(courseGrade)) && Number(attemptedCredit) === 0.50 && Number(attemptedCredit) !== Number(earnedCredit));
                const includedInAverage = (Number(attemptedCredit) === 0.50 && Number(earnedCredit) === 0.50) || noCreditAverage;
                
                const course = {
                    code: courseCode,
                    name: courseName,
                    grade: courseGrade,
                    gpa,
                    attemptedCredit,
                    earnedCredit,
                    noCreditAverage,
                    includedInAverage,
                }
                courses.push(course);
            })
        }
        const cumulativeCredits = termDetails.match(cumulativeCreditRegex);
        const cumulativeGPA = getStringData(termDetails.match(cumulativeGPARegex));
        const termCredits = termDetails.match(termCreditRegex);
        const termGPA = getStringData(termDetails.match(termGPARegex));
        const term4GPA = calculateTermGPA(courses);

        cumulativeGrade = cumulativeGPA ? cumulativeGPA : cumulativeGrade;
        
        const cumulativeCredit = {
            attempted: getCredit(cumulativeCredits, 'attempted'),
            earned: getCredit(cumulativeCredits, 'earned'),
        }
        
        const termCredit = {
            attempted: getCredit(termCredits, 'attempted'),
            earned: getCredit(termCredits, 'earned'),
        }
        
        const termInfo = {
            program,
            level,
            term,
            termCredit,
            termGPA,
            term4GPA,
            cumulativeCredit,
            cumulativeGPA,
            courses,
        }
        
        terms.push(termInfo);
    })

    const cumulative4GPA = calculateCumulativeGPA(terms);

    const transcript = {
        id,
        name,
        ontarioNumber,
        cumulative4GPA,
        cumulativeGrade,
        terms,
    };

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(transcript);
        }, 20000);
        });
}

exports.parsePdf = parsePdf;