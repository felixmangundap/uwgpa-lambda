const convertGPA = (grade) => {
  const parsedGrade = parseInt(grade);
  if (90 <= parsedGrade && parsedGrade <= 100) {
    return 4.00;
  }
  if (85 <= parsedGrade && parsedGrade <= 89) {
    return 3.90;
  }
  if (80 <= parsedGrade && parsedGrade <= 84) {
    return 3.70;
  }
  if (77 <= parsedGrade && parsedGrade <= 79) {
    return 3.30;
  }
  if (73 <= parsedGrade && parsedGrade <= 76) {
    return 3.00;
  }
  if (70 <= parsedGrade && parsedGrade <= 72) {
    return 2.70;
  }
  if (67 <= parsedGrade && parsedGrade <= 69) {
    return 2.30;
  }
  if (63 <= parsedGrade && parsedGrade <= 66) {
    return 2.00;
  }
  if (60 <= parsedGrade && parsedGrade <= 62) {
    return 1.70;
  }
  if (57 <= parsedGrade && parsedGrade <= 59) {
    return 1.30;
  }
  if (53 <= parsedGrade && parsedGrade <= 56) {
    return 1.00;
  }
  if (50 <= parsedGrade && parsedGrade <= 52) {
    return 0.70;
  }
  if (parsedGrade <= 49) {
    return 0.00;
  }
  return grade;
}

exports.convertGPA = convertGPA;