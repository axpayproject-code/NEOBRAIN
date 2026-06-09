export interface PhRegion {
  id: string;
  name: string;
  provinces: string[];
  hub: string;
}

export const PH_REGIONS: PhRegion[] = [
  { id: "NCR", name: "NCR – Metro Manila", hub: "Manila", provinces: ["Metro Manila", "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "Pateros", "Quezon City", "San Juan", "Taguig", "Valenzuela"] },
  { id: "CAR", name: "CAR – Cordillera", hub: "Baguio City", provinces: ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province", "Baguio City"] },
  { id: "I", name: "Region I – Ilocos", hub: "San Fernando, La Union", provinces: ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"] },
  { id: "II", name: "Region II – Cagayan Valley", hub: "Tuguegarao City", provinces: ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"] },
  { id: "III", name: "Region III – Central Luzon", hub: "San Fernando, Pampanga", provinces: ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"] },
  { id: "IVA", name: "CALABARZON (IV-A)", hub: "Calamba, Laguna", provinces: ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"] },
  { id: "IVB", name: "MIMAROPA (IV-B)", hub: "Puerto Princesa, Palawan", provinces: ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"] },
  { id: "V", name: "Region V – Bicol", hub: "Legazpi City", provinces: ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"] },
  { id: "VI", name: "Region VI – Western Visayas", hub: "Iloilo City", provinces: ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"] },
  { id: "VII", name: "Region VII – Central Visayas", hub: "Cebu City", provinces: ["Bohol", "Cebu", "Negros Oriental", "Siquijor"] },
  { id: "VIII", name: "Region VIII – Eastern Visayas", hub: "Tacloban City", provinces: ["Biliran", "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte"] },
  { id: "IX", name: "Region IX – Zamboanga Peninsula", hub: "Zamboanga City", provinces: ["Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"] },
  { id: "X", name: "Region X – Northern Mindanao", hub: "Cagayan de Oro", provinces: ["Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental"] },
  { id: "XI", name: "Region XI – Davao Region", hub: "Davao City", provinces: ["Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental"] },
  { id: "XII", name: "Region XII – SOCCSKSARGEN", hub: "Koronadal City", provinces: ["Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat"] },
  { id: "XIII", name: "CARAGA (Region XIII)", hub: "Butuan City", provinces: ["Agusan del Norte", "Agusan del Sur", "Dinagat Islands", "Surigao del Norte", "Surigao del Sur"] },
  { id: "BARMM", name: "BARMM – Bangsamoro", hub: "Cotabato City", provinces: ["Basilan", "Lanao del Sur", "Maguindanao del Norte", "Maguindanao del Sur", "Sulu", "Tawi-Tawi"] },
];

export interface Specialist {
  name: string;
  credentials: string;
  regionId: string;
  city: string;
  clinic?: string;
  telehealth: boolean;
  inPerson: boolean;
}

export const SPECIALISTS_BY_TYPE: Record<string, Specialist[]> = {
  developmental_pediatrician: [
    { name: "Dr. Maria Santos", credentials: "MD, DPPS, FAAP", regionId: "NCR", city: "Makati City", clinic: "NEOBRAIN Care Center Makati, Ayala Ave.", telehealth: true, inPerson: true },
    { name: "Dr. Jose Reyes", credentials: "MD, FPPS", regionId: "NCR", city: "Quezon City", clinic: "St. Luke's Medical Center QC, E. Rodriguez Ave.", telehealth: true, inPerson: true },
    { name: "Dr. Ana Cruz", credentials: "MD, DPPS", regionId: "VII", city: "Cebu City", clinic: "NEOBRAIN Visayas Hub, A.S. Fortuna St.", telehealth: true, inPerson: true },
    { name: "Dr. Ricardo Padilla", credentials: "MD, DPPS, FPPS", regionId: "IVA", city: "Calamba, Laguna", clinic: "NEOBRAIN CALABARZON Clinic, National Hwy.", telehealth: true, inPerson: true },
    { name: "Dr. Lourdes Fernandez", credentials: "MD, DPPS", regionId: "XI", city: "Davao City", clinic: "NEOBRAIN Mindanao Hub, Ilustre St.", telehealth: true, inPerson: true },
    { name: "Dr. Emilio Torres", credentials: "MD, FPPS", regionId: "III", city: "Angeles City, Pampanga", clinic: "NEOBRAIN Central Luzon, McArthur Hwy.", telehealth: true, inPerson: true },
    { name: "Dr. Carmen Villafuerte", credentials: "MD, DPPS", regionId: "VI", city: "Iloilo City", clinic: "NEOBRAIN Western Visayas, Iznart St.", telehealth: true, inPerson: true },
    { name: "Dr. Dennis Magno", credentials: "MD, FPPS", regionId: "X", city: "Cagayan de Oro", clinic: "NEOBRAIN Northern Mindanao, Corrales Ave.", telehealth: true, inPerson: true },
    { name: "Dr. Beatriz Navarro", credentials: "MD, DPPS", regionId: "I", city: "Dagupan City, Pangasinan", clinic: "NEOBRAIN Ilocos Clinic, Perez Blvd.", telehealth: true, inPerson: true },
  ],
  psychologist: [
    { name: "Dr. Liza Dela Cruz", credentials: "PhD, RPsy", regionId: "NCR", city: "Mandaluyong City", clinic: "NEOBRAIN Psychology Center, Shaw Blvd.", telehealth: true, inPerson: true },
    { name: "Dr. Ramon Villanueva", credentials: "RPsy, RPm", regionId: "NCR", city: "Pasig City", clinic: "NEOBRAIN East Manila, C5 Road", telehealth: true, inPerson: true },
    { name: "Dr. Grace Tan", credentials: "PhD, RPsy", regionId: "VII", city: "Cebu City", clinic: "Cebu Children's Mind Center, Lahug", telehealth: true, inPerson: true },
    { name: "Dr. Patricia Gonzales", credentials: "RPsy", regionId: "IVA", city: "Antipolo, Rizal", clinic: "NEOBRAIN Rizal Clinic, Circumferential Rd.", telehealth: true, inPerson: true },
    { name: "Dr. Anton Medina", credentials: "PhD, RPsy", regionId: "XI", city: "Davao City", clinic: "Davao Child Development Clinic, Claveria St.", telehealth: true, inPerson: true },
    { name: "Dr. Suzanne Chua", credentials: "RPsy, RPm", regionId: "III", city: "Angeles City, Pampanga", clinic: "NEOBRAIN Pampanga, Balibago", telehealth: true, inPerson: true },
    { name: "Dr. Helena Dizon", credentials: "PhD, RPsy", regionId: "VI", city: "Iloilo City", clinic: "Western Visayas Child Psychology, Gen. Luna St.", telehealth: true, inPerson: true },
  ],
  psychiatrist: [
    { name: "Dr. Eduardo Flores", credentials: "MD, FPPA, SpBP", regionId: "NCR", city: "Makati City", clinic: "NEOBRAIN Psychiatry, Ayala Medical Center", telehealth: true, inPerson: true },
    { name: "Dr. Carla Mendoza", credentials: "MD, FPPA", regionId: "NCR", city: "Quezon City", clinic: "NEOBRAIN Mental Health QC, Commonwealth Ave.", telehealth: true, inPerson: true },
    { name: "Dr. Victor Aguilar", credentials: "MD, FPPA", regionId: "VII", city: "Cebu City", clinic: "Cebu Child Psychiatry Clinic, Banilad", telehealth: true, inPerson: true },
    { name: "Dr. Felicia Marquez", credentials: "MD, SpBP", regionId: "XI", city: "Davao City", clinic: "Southern Mindanao Child Psychiatry", telehealth: true, inPerson: true },
  ],
  speech_therapist: [
    { name: "Jennifer Ramos", credentials: "MSc, RSLP", regionId: "NCR", city: "Taguig City", clinic: "NEOBRAIN Speech & Language, BGC", telehealth: true, inPerson: true },
    { name: "Mark Bautista", credentials: "MA, SLP", regionId: "NCR", city: "Parañaque City", clinic: "NEOBRAIN South Manila, Dr. A. Santos Ave.", telehealth: true, inPerson: true },
    { name: "Sheila Ocampo", credentials: "MSc, RSLP", regionId: "VII", city: "Cebu City", clinic: "Cebu Speech Therapy Hub, Banawa", telehealth: true, inPerson: true },
    { name: "Carlos Navarro", credentials: "MA, SLP", regionId: "IVA", city: "Cavite City", clinic: "NEOBRAIN CAVITE, Palico Rd.", telehealth: true, inPerson: true },
    { name: "Rachelle Santos", credentials: "MSc, RSLP", regionId: "XI", city: "Davao City", clinic: "Davao Speech & Language Center", telehealth: true, inPerson: true },
    { name: "Josephine Reyes", credentials: "MA, SLP", regionId: "X", city: "Cagayan de Oro", clinic: "Northern Mindanao Speech Clinic", telehealth: true, inPerson: true },
  ],
  occupational_therapist: [
    { name: "Anna Gonzales", credentials: "MOT, OTR", regionId: "NCR", city: "Quezon City", clinic: "NEOBRAIN OT Center QC, Elliptical Rd.", telehealth: true, inPerson: true },
    { name: "Leo Santos", credentials: "BOT", regionId: "NCR", city: "Mandaluyong City", clinic: "NEOBRAIN OT Shaw Blvd.", telehealth: true, inPerson: true },
    { name: "Mary Abad", credentials: "MOT, OTR", regionId: "VII", city: "Cebu City", clinic: "Cebu Occupational Therapy Hub", telehealth: true, inPerson: true },
    { name: "Ivan dela Rosa", credentials: "BOT, OTR", regionId: "IVA", city: "Batangas City", clinic: "NEOBRAIN Batangas Clinic", telehealth: true, inPerson: true },
    { name: "Maria Soriano", credentials: "MOT", regionId: "XI", city: "Davao City", clinic: "Davao OT & Sensory Center", telehealth: true, inPerson: true },
  ],
  behavioral_therapist: [
    { name: "Carlos Rivera", credentials: "BCBA, MA", regionId: "NCR", city: "Makati City", clinic: "NEOBRAIN ABA Center Makati, Gil Puyat Ave.", telehealth: true, inPerson: true },
    { name: "Rachel Lim", credentials: "BCaBA", regionId: "NCR", city: "Pasig City", clinic: "NEOBRAIN ABA Ortigas", telehealth: true, inPerson: true },
    { name: "Daniel Soriano", credentials: "BCBA", regionId: "VII", city: "Cebu City", clinic: "Cebu Behavioral Health Clinic, Talamban", telehealth: true, inPerson: true },
    { name: "Angela Buenaventura", credentials: "BCBA, MA", regionId: "IVA", city: "Biñan, Laguna", clinic: "NEOBRAIN CALABARZON ABA Center", telehealth: true, inPerson: true },
    { name: "Francis Domingo", credentials: "BCBA", regionId: "XI", city: "Davao City", clinic: "Davao Behavioral Therapy Hub", telehealth: true, inPerson: true },
    { name: "Gina Castillo", credentials: "BCaBA", regionId: "X", city: "Cagayan de Oro", clinic: "NEOBRAIN CDO Behavioral Center", telehealth: true, inPerson: true },
  ],
};

export const PAYMENT_CHANNELS = [
  {
    id: "gcash",
    name: "GCash",
    label: "Mobile Wallet",
    logo: "G",
    gradient: "from-[#1A6EF7] via-[#0B9EFB] to-[#00C2FF]",
    accountName: "Joseph Francois",
    accountNumber: "0998 2550 149",
    steps: [
      "Open GCash app → Send Money → GCash",
      "Enter the account number above and the exact consultation fee",
      "Use the reference code below as your payment remarks",
      "Screenshot your payment confirmation screen",
    ],
  },
  {
    id: "bpi",
    name: "BPI",
    label: "Bank Transfer",
    logo: "B",
    gradient: "from-[#CC0000] via-[#E83333] to-[#FF5555]",
    accountName: "Joseph Francois",
    accountNumber: "0656 2994 12",
    steps: [
      "Open BPI Online or BPI app → Send Money → Other BPI",
      "Enter the account number above and the exact consultation fee",
      "Use the reference code below as your payment remarks",
      "Screenshot your payment confirmation receipt",
    ],
  },
];
