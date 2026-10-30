// Fixed subject and chapter lists for the practice test series.
// Edit this file, run `node scripts/generate-catalog-seed.mjs`, then run the generated SQL.
// Teachers can also add, rename or hide subjects and topics from the Teacher panel.

export const BOARDS = ["cbse", "bseb"];

/** Subjects offered to every student of a class (below class 11), per board. */
const JUNIOR = {
  cbse: {
    "6-8": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
    "9-10": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit"],
  },
  bseb: {
    "6-8": ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit"],
    "9-10": ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit"],
  },
};

/** Classes 11 and 12: subjects per stream. A subject listed under "common" is offered to every stream. */
const SENIOR = {
  cbse: {
    common: ["English"],
    science: ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"],
    commerce: ["Accountancy", "Business Studies", "Economics", "Mathematics"],
    arts: ["History", "Political Science", "Geography", "Economics", "Sociology", "Psychology", "Hindi"],
  },
  bseb: {
    common: ["Hindi", "English"],
    science: ["Physics", "Chemistry", "Mathematics", "Biology"],
    commerce: ["Accountancy", "Business Studies", "Economics", "Mathematics"],
    arts: ["History", "Geography", "Political Science", "Economics", "Psychology", "Sociology"],
  },
};

/** Every subject row to create: { board, class, stream (or null), name, position }. */
export function listSubjects() {
  const rows = [];
  for (const board of BOARDS) {
    for (let klass = 6; klass <= 10; klass += 1) {
      const key = klass <= 8 ? "6-8" : "9-10";
      JUNIOR[board][key].forEach((name, index) =>
        rows.push({ board, class: klass, stream: null, name, position: index + 1 }),
      );
    }
    for (const klass of [11, 12]) {
      const { common, ...streams } = SENIOR[board];
      common.forEach((name, index) =>
        rows.push({ board, class: klass, stream: null, name, position: index + 1 }),
      );
      for (const [stream, names] of Object.entries(streams)) {
        names.forEach((name, index) =>
          rows.push({ board, class: klass, stream, name, position: common.length + index + 1 }),
        );
      }
    }
  }
  return rows;
}

/**
 * Chapter lists, keyed by "class|Subject". They follow the NCERT textbooks, which CBSE uses and
 * which BSEB's science and mathematics books follow for these classes. Other subjects are
 * loaded without chapters so teachers add the ones from their own textbooks.
 */
export const CHAPTERS = {
  "9|Mathematics": [
    "Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables",
    "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals",
    "Circles", "Heron's Formula", "Surface Areas and Volumes", "Statistics",
  ],
  "9|Science": [
    "Matter in Our Surroundings", "Is Matter Around Us Pure?", "Atoms and Molecules",
    "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Motion",
    "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound",
    "Improvement in Food Resources",
  ],
  "10|Mathematics": [
    "Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables",
    "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry",
    "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles",
    "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability",
  ],
  "10|Science": [
    "Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals",
    "Carbon and its Compounds", "Life Processes", "Control and Coordination",
    "How do Organisms Reproduce?", "Heredity", "Light - Reflection and Refraction",
    "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current",
    "Our Environment",
  ],
  "11|Physics": [
    "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion",
    "Work, Energy and Power", "System of Particles and Rotational Motion", "Gravitation",
    "Mechanical Properties of Solids", "Mechanical Properties of Fluids",
    "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves",
  ],
  "12|Physics": [
    "Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity",
    "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction",
    "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments",
    "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei",
    "Semiconductor Electronics: Materials, Devices and Simple Circuits",
  ],
  "11|Chemistry": [
    "Some Basic Concepts of Chemistry", "Structure of Atom",
    "Classification of Elements and Periodicity in Properties",
    "Chemical Bonding and Molecular Structure", "Thermodynamics", "Equilibrium",
    "Redox Reactions", "Organic Chemistry: Some Basic Principles and Techniques", "Hydrocarbons",
  ],
  "12|Chemistry": [
    "Solutions", "Electrochemistry", "Chemical Kinetics", "The d- and f-Block Elements",
    "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers",
    "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules",
  ],
  "11|Biology": [
    "The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom",
    "Morphology of Flowering Plants", "Anatomy of Flowering Plants",
    "Structural Organisation in Animals", "Cell: The Unit of Life", "Biomolecules",
    "Cell Cycle and Cell Division", "Photosynthesis in Higher Plants", "Respiration in Plants",
    "Plant Growth and Development", "Breathing and Exchange of Gases",
    "Body Fluids and Circulation", "Excretory Products and their Elimination",
    "Locomotion and Movement", "Neural Control and Coordination",
    "Chemical Coordination and Integration",
  ],
  "12|Biology": [
    "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health",
    "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution",
    "Human Health and Disease", "Microbes in Human Welfare",
    "Biotechnology: Principles and Processes", "Biotechnology and its Applications",
    "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation",
  ],
  "11|Mathematics": [
    "Sets", "Relations and Functions", "Trigonometric Functions",
    "Complex Numbers and Quadratic Equations", "Linear Inequalities",
    "Permutations and Combinations", "Binomial Theorem", "Sequences and Series",
    "Straight Lines", "Conic Sections", "Introduction to Three Dimensional Geometry",
    "Limits and Derivatives", "Statistics", "Probability",
  ],
  "12|Mathematics": [
    "Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants",
    "Continuity and Differentiability", "Application of Derivatives", "Integrals",
    "Application of Integrals", "Differential Equations", "Vector Algebra",
    "Three Dimensional Geometry", "Linear Programming", "Probability",
  ],
};
