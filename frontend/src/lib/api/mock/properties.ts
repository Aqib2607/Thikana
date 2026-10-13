import type {
  PropertyItem,
  PropertyFilter,
  PropertyListResponse,
  MatchBreakdown,
} from "../properties";

// Khulna Coordinates Center
export const KHULNA_CENTER = { lat: 22.8456, lng: 89.5403 };

export const KHULNA_AREAS = [
  "All Areas",
  "KUET Gate / Teligati",
  "Gallamari / Zero Point (KU)",
  "Sonadanga R/A",
  "Boyra",
  "Mujgunni",
  "Nirala R/A",
  "Khalishpur",
  "Daulatpur (BL College)",
  "Choto Boyra",
  "Shibbari Mor",
] as const;

export const ALL_AMENITIES = [
  "High-Speed WiFi",
  "Generator / IPS Backup",
  "24/7 Deep Tube-Well Water",
  "Security Guard",
  "CCTV Surveillance",
  "Attached Bathroom",
  "Private Balcony",
  "Dining Space",
  "Refrigerator",
  "Daily Meal / Mess System",
  "Rooftop Access",
  "Motorbike Parking",
  "Gas Pipeline / Cylinder",
  "Elevator / Lift",
] as const;

// Curated Unsplash images for student rooms, flats and houses
const SAMPLE_IMAGES = {
  flat1: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  ],
  room1: [
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  ],
  mess1: [
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
  ],
  house1: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
  ],
};

export const MOCK_PROPERTIES: PropertyItem[] = [
  {
    id: "prop-kuet-01",
    title: "Quiet 2-Bed Flat Near KUET Main Gate",
    banglaTitle: "কুয়েট মেইন গেটের কাছে শান্ত ২ রুমের ফ্ল্যাট",
    slug: "quiet-2-bed-flat-near-kuet-main-gate",
    propertyType: "Apartment / Flat",
    rentalType: "Monthly Rental",
    rent: 9500,
    advance: 15000,
    additionalCharges: 1200,
    billsIncluded: ["Water Supply", "Trash Management"],
    availability: "Available",
    availableFrom: "2026-11-01",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "KUET Gate / Teligati",
    exactAddress: "Holding #42, Teacher's Colony Road, Teligati, Fulbarigate, Khulna-9203",
    lat: 22.8997,
    lng: 89.5028,
    size: 780,
    rooms: 2,
    bathrooms: 2,
    balconies: 2,
    floor: "3rd Floor",
    totalFloors: 5,
    furnishedStatus: "Semi-Furnished",
    preferredTenant: "Students Only",
    images: SAMPLE_IMAGES.flat1,
    featuredImage: SAMPLE_IMAGES.flat1[0],
    amenities: [
      "High-Speed WiFi",
      "Generator / IPS Backup",
      "24/7 Deep Tube-Well Water",
      "Security Guard",
      "CCTV Surveillance",
      "Attached Bathroom",
      "Private Balcony",
      "Motorbike Parking",
      "Rooftop Access",
    ],
    verifications: [
      "Owner Identity Verified",
      "Phone Verified",
      "Availability Verified",
      "Documents Verified",
    ],
    community: {
      transport:
        "4 mins walk to KUET Main Academic Gate. Frequent easybikes available to Fulbarigate.",
      waterlogging:
        "No waterlogging history. Street level is elevated with underground RCC drainage.",
      internet: "Carnival & AmberIT active fibers on premises (40-60 Mbps average latency < 15ms).",
      noise: "Extremely quiet academic zone; ideal for engineering students and thesis work.",
      safety: "CCTV surveillance active on ground entrance, night guard on duty 8 PM - 6 AM.",
      general: "Pharmacy, stationery store and dining mess within 100 meters on Teligati Mor.",
    },
    landlord: {
      id: "u-landlord",
      name: "Kabir Hossain",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      memberSince: "March 2024",
      publicContactVisible: false,
      phone: "01722222222",
      email: "landlord@demo.test",
      verified: true,
    },
    rating: 4.8,
    reviewCount: 7,
    createdAt: "2026-09-15T10:00:00Z",
    updatedAt: "2026-10-10T14:30:00Z",
  },
  {
    id: "prop-ku-02",
    title: "Attached Bath Single Room in Gallamari Student House",
    banglaTitle: "গল্লামারী ছাত্রাবাসে অ্যাটাচড বাথরুম সিঙ্গেল রুম",
    slug: "attached-bath-single-room-gallamari-ku",
    propertyType: "Room",
    rentalType: "Monthly Rental",
    rent: 4200,
    advance: 4200,
    additionalCharges: 500,
    billsIncluded: ["Water Supply", "High-Speed WiFi"],
    availability: "Available",
    availableFrom: "2026-10-20",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "Gallamari / Zero Point (KU)",
    exactAddress: "House 18, Block B, Main Road, Gallamari, Khulna-9208 (Adjacent to KU Link)",
    lat: 22.8021,
    lng: 89.5358,
    size: 210,
    rooms: 1,
    bathrooms: 1,
    balconies: 1,
    floor: "2nd Floor",
    totalFloors: 4,
    furnishedStatus: "Furnished",
    preferredTenant: "Male Students Only",
    images: SAMPLE_IMAGES.room1,
    featuredImage: SAMPLE_IMAGES.room1[0],
    amenities: [
      "High-Speed WiFi",
      "24/7 Deep Tube-Well Water",
      "Attached Bathroom",
      "Private Balcony",
      "Rooftop Access",
      "Security Guard",
    ],
    verifications: ["Owner Identity Verified", "Phone Verified", "Availability Verified"],
    community: {
      transport: "Direct 6 mins walk to Khulna University 1st Academic Building / Zero Point.",
      waterlogging:
        "Main road stays dry; inner lane experiences shallow puddle during flash downpours.",
      internet: "Dot Internet 35 Mbps optical fiber included in room rent.",
      noise: "Moderate during evening hours near market; peaceful room facing the inner garden.",
      safety: "Main collapsible gate locks at 11 PM for student safety.",
      general: "Khulna University cafeteria, printing press, and evening tea stalls right outside.",
    },
    landlord: {
      id: "l-gallamari-1",
      name: "Mustafa Rahman",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      memberSince: "January 2024",
      publicContactVisible: true,
      phone: "01733333333",
      email: "mustafa.ku@demo.test",
      verified: true,
    },
    rating: 4.6,
    reviewCount: 12,
    createdAt: "2026-08-20T08:00:00Z",
    updatedAt: "2026-10-05T09:15:00Z",
  },
  {
    id: "prop-sonadanga-03",
    title: "Spacious 3-Bed Family/Student Apartment in Sonadanga R/A",
    banglaTitle: "সোনাডাঙ্গা আবাসিক এলাকায় ৩ রুমের আধুনিক অ্যাপার্টমেন্ট",
    slug: "spacious-3-bed-apartment-sonadanga-ra",
    propertyType: "Apartment / Flat",
    rentalType: "Monthly Rental",
    rent: 14500,
    advance: 25000,
    additionalCharges: 1800,
    billsIncluded: ["Water Supply", "Security Guard"],
    availability: "Available",
    availableFrom: "2026-11-01",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "Sonadanga R/A",
    exactAddress: "Plot 112, Road #4, Phase 2, Sonadanga Residential Area, Khulna-9100",
    lat: 22.8252,
    lng: 89.5441,
    size: 1150,
    rooms: 3,
    bathrooms: 2,
    balconies: 2,
    floor: "4th Floor",
    totalFloors: 6,
    furnishedStatus: "Unfurnished",
    preferredTenant: "Any",
    images: SAMPLE_IMAGES.flat1,
    featuredImage: SAMPLE_IMAGES.flat1[0],
    amenities: [
      "24/7 Deep Tube-Well Water",
      "Elevator / Lift",
      "Generator / IPS Backup",
      "Security Guard",
      "CCTV Surveillance",
      "Private Balcony",
      "Motorbike Parking",
      "Gas Pipeline / Cylinder",
    ],
    verifications: [
      "Owner Identity Verified",
      "Phone Verified",
      "Availability Verified",
      "Documents Verified",
    ],
    community: {
      transport:
        "3 mins to Sonadanga Bus Terminal. Easy rickshaws and easybikes to New Market & Shibbari.",
      waterlogging: "Zero waterlogging. Premier planned residential infrastructure in Khulna.",
      internet: "Link3, AmberIT, Carnival gigabit lines available on user setup.",
      noise: "Very quiet high-class residential area with strict community night quiet hours.",
      safety: "Gated phase with checkpoint guards and 24-hour patrols.",
      general: "Nearby parks, super shops, Sonadanga Thana, and private hospitals within 500m.",
    },
    landlord: {
      id: "u-landlord",
      name: "Kabir Hossain",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      memberSince: "March 2024",
      publicContactVisible: false,
      phone: "01722222222",
      email: "landlord@demo.test",
      verified: true,
    },
    rating: 4.9,
    reviewCount: 9,
    createdAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-10-11T16:00:00Z",
  },
  {
    id: "prop-boyra-04",
    title: "Organized Boyra Mess Sublet with Daily Meal System",
    banglaTitle: "বয়রা কলেজ রোডে মিল সিস্টেমসহ মেস সাবলেট",
    slug: "organized-boyra-mess-sublet-daily-meal",
    propertyType: "Mess",
    rentalType: "Sublet",
    rent: 3200,
    advance: 3200,
    additionalCharges: 2500, // Meal cost
    billsIncluded: ["High-Speed WiFi", "24/7 Deep Tube-Well Water", "Gas Pipeline / Cylinder"],
    availability: "Available",
    availableFrom: "2026-10-15",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "Boyra",
    exactAddress: "Lane 3, Behind Boyra Govt. Women's College, Boyra Main Road, Khulna-9000",
    lat: 22.8423,
    lng: 89.5312,
    size: 180,
    rooms: 1,
    bathrooms: 2, // Shared
    balconies: 1,
    floor: "1st Floor",
    totalFloors: 3,
    furnishedStatus: "Furnished",
    preferredTenant: "Female Students Only",
    images: SAMPLE_IMAGES.mess1,
    featuredImage: SAMPLE_IMAGES.mess1[0],
    amenities: [
      "High-Speed WiFi",
      "Daily Meal / Mess System",
      "Dining Space",
      "Refrigerator",
      "24/7 Deep Tube-Well Water",
      "Security Guard",
      "Rooftop Access",
    ],
    verifications: ["Owner Identity Verified", "Phone Verified", "Availability Verified"],
    community: {
      transport:
        "Walking distance to Boyra Women's College, 5 mins easybike to Khulna Medical College.",
      waterlogging:
        "Safe during ordinary rain, slight waterlogging on main avenue during cyclone storms.",
      internet: "40 Mbps WiFi with router on each corridor.",
      noise: "Peaceful female student mess environment with study room discipline.",
      safety: "Caretaker lady stays in ground floor unit, gates locked at 9:30 PM.",
      general: "Tailoring shops, ladies salon, fresh vegetable bazaar within 2 minutes walk.",
    },
    landlord: {
      id: "l-boyra-fem",
      name: "Salma Begum",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      memberSince: "February 2024",
      publicContactVisible: true,
      phone: "01744444444",
      email: "salma.mess@demo.test",
      verified: true,
    },
    rating: 4.7,
    reviewCount: 15,
    createdAt: "2026-07-10T11:00:00Z",
    updatedAt: "2026-10-08T18:00:00Z",
  },
  {
    id: "prop-mujgunni-05",
    title: "Furnished 2-Bed Flat in Mujgunni Residential Block",
    banglaTitle: "মুজগুন্নী আবাসিক ব্লকে ফার্নিশড ২ রুমের ফ্ল্যাট",
    slug: "furnished-2-bed-flat-mujgunni-block",
    propertyType: "Apartment / Flat",
    rentalType: "Monthly Rental",
    rent: 11000,
    advance: 20000,
    additionalCharges: 1000,
    billsIncluded: ["24/7 Deep Tube-Well Water", "Security Guard"],
    availability: "Available",
    availableFrom: "2026-11-15",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "Mujgunni",
    exactAddress: "House 67, Road 2, Mujgunni Residential Area, Khalishpur Link, Khulna-9000",
    lat: 22.8582,
    lng: 89.5298,
    size: 850,
    rooms: 2,
    bathrooms: 2,
    balconies: 2,
    floor: "2nd Floor",
    totalFloors: 4,
    furnishedStatus: "Furnished",
    preferredTenant: "Any",
    images: SAMPLE_IMAGES.flat1,
    featuredImage: SAMPLE_IMAGES.flat1[0],
    amenities: [
      "High-Speed WiFi",
      "Generator / IPS Backup",
      "24/7 Deep Tube-Well Water",
      "Attached Bathroom",
      "Private Balcony",
      "Refrigerator",
      "Motorbike Parking",
      "CCTV Surveillance",
    ],
    verifications: [
      "Owner Identity Verified",
      "Phone Verified",
      "Availability Verified",
      "Documents Verified",
    ],
    community: {
      transport: "Connecting road to BIDC & Boyra, quick easybike access across northern Khulna.",
      waterlogging: "Well-maintained drainage, no road flooding.",
      internet: "Carnival Broadband connected with gigabit switch.",
      noise: "Residential area with trees and open backyard view.",
      safety: "Community gate with night watchman.",
      general: "Local mosque, grocery, and playground within walking reach.",
    },
    landlord: {
      id: "l-mujgunni-1",
      name: "Tariqul Islam",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      memberSince: "April 2024",
      publicContactVisible: false,
      phone: "01755555555",
      email: "tariqul.islam@demo.test",
      verified: true,
    },
    rating: 4.5,
    reviewCount: 4,
    createdAt: "2026-09-22T14:00:00Z",
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "prop-nirala-06",
    title: "Independent Floor Duplex House Portion in Nirala R/A",
    banglaTitle: "নিরালা আবাসিক এলাকায় ডুপ্লেক্স বাড়ির সম্পূর্ণ ফ্লোর",
    slug: "independent-floor-duplex-nirala-ra",
    propertyType: "House",
    rentalType: "Monthly Rental",
    rent: 18000,
    advance: 35000,
    additionalCharges: 2000,
    billsIncluded: ["24/7 Deep Tube-Well Water", "Security Guard", "Motorbike Parking"],
    availability: "Available",
    availableFrom: "2026-12-01",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "Nirala R/A",
    exactAddress: "Road #8, Plot 24, Nirala Residential Area, Khulna-9100",
    lat: 22.8115,
    lng: 89.5521,
    size: 1350,
    rooms: 3,
    bathrooms: 3,
    balconies: 3,
    floor: "1st Floor",
    totalFloors: 2,
    furnishedStatus: "Semi-Furnished",
    preferredTenant: "Family Only",
    images: SAMPLE_IMAGES.house1,
    featuredImage: SAMPLE_IMAGES.house1[0],
    amenities: [
      "24/7 Deep Tube-Well Water",
      "Generator / IPS Backup",
      "Attached Bathroom",
      "Private Balcony",
      "Dining Space",
      "Rooftop Access",
      "Motorbike Parking",
      "Security Guard",
      "CCTV Surveillance",
    ],
    verifications: [
      "Owner Identity Verified",
      "Phone Verified",
      "Availability Verified",
      "Documents Verified",
    ],
    community: {
      transport: "Near Royal Mor & Khulna Club. Direct access to Khan Jahan Ali Road.",
      waterlogging: "Clean, elevated area, zero waterlogging.",
      internet: "Multiple ISP lines readily available.",
      noise: "Elite quiet neighborhood, strictly peaceful.",
      safety: "Guarded residential society with 24/7 boom barriers.",
      general: "Nearby English medium schools, bakeries, and Nirala Park.",
    },
    landlord: {
      id: "u-landlord",
      name: "Kabir Hossain",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      memberSince: "March 2024",
      publicContactVisible: true,
      phone: "01722222222",
      email: "landlord@demo.test",
      verified: true,
    },
    rating: 5.0,
    reviewCount: 6,
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-10-12T11:00:00Z",
  },
  {
    id: "prop-daulatpur-07",
    title: "Economical Room for BL College Students in Daulatpur",
    banglaTitle: "দৌলতপুরে বিএল কলেজের ছাত্রদের জন্য সাশ্রয়ী রুম",
    slug: "economical-room-bl-college-daulatpur",
    propertyType: "Room",
    rentalType: "Monthly Rental",
    rent: 3000,
    advance: 3000,
    additionalCharges: 400,
    billsIncluded: ["24/7 Deep Tube-Well Water", "High-Speed WiFi"],
    availability: "Available",
    availableFrom: "2026-10-18",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "Daulatpur (BL College)",
    exactAddress: "College Road, Near BL College Hostel Gate 2, Daulatpur, Khulna-9202",
    lat: 22.8805,
    lng: 89.5187,
    size: 160,
    rooms: 1,
    bathrooms: 1,
    balconies: 0,
    floor: "Ground Floor",
    totalFloors: 2,
    furnishedStatus: "Semi-Furnished",
    preferredTenant: "Students Only",
    images: SAMPLE_IMAGES.room1,
    featuredImage: SAMPLE_IMAGES.room1[0],
    amenities: ["High-Speed WiFi", "24/7 Deep Tube-Well Water", "Rooftop Access"],
    verifications: ["Owner Identity Verified", "Phone Verified", "Availability Verified"],
    community: {
      transport:
        "3 mins walk to Govt. Brajalal (BL) College main gate. Daulatpur rail station 10 mins.",
      waterlogging: "No waterlogging in courtyard.",
      internet: "Shared 30 Mbps broadband included in rent.",
      noise: "Lively student area during daytime, quiet after 10 PM.",
      safety: "Hostel supervisor on premises.",
      general: "Book stores, photocopy shops, affordable student eateries everywhere.",
    },
    landlord: {
      id: "l-daulatpur-1",
      name: "Anisur Rahman",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      memberSince: "May 2024",
      publicContactVisible: false,
      phone: "01766666666",
      email: "anisur.bl@demo.test",
      verified: true,
    },
    rating: 4.3,
    reviewCount: 11,
    createdAt: "2026-06-20T10:00:00Z",
    updatedAt: "2026-10-02T15:00:00Z",
  },
  {
    id: "prop-khalishpur-08",
    title: "Quiet 2-Bed Sublet Flat in Khalishpur Housing",
    banglaTitle: "খালিশপুর হাউজিং এ শান্ত পরিবেশে ২ রুমের সাবলেট",
    slug: "quiet-2-bed-sublet-khalishpur-housing",
    propertyType: "Sublet",
    rentalType: "Sublet",
    rent: 7500,
    advance: 10000,
    additionalCharges: 800,
    billsIncluded: ["24/7 Deep Tube-Well Water", "Gas Pipeline / Cylinder"],
    availability: "Available",
    availableFrom: "2026-11-01",
    division: "Khulna",
    district: "Khulna",
    city: "Khulna",
    area: "Khalishpur",
    exactAddress: "Road 14, New Colony, Khalishpur, Khulna-9000",
    lat: 22.8615,
    lng: 89.5392,
    size: 620,
    rooms: 2,
    bathrooms: 1,
    balconies: 1,
    floor: "3rd Floor",
    totalFloors: 4,
    furnishedStatus: "Semi-Furnished",
    preferredTenant: "Any",
    images: SAMPLE_IMAGES.flat1,
    featuredImage: SAMPLE_IMAGES.flat1[0],
    amenities: [
      "High-Speed WiFi",
      "24/7 Deep Tube-Well Water",
      "Attached Bathroom",
      "Private Balcony",
      "Gas Pipeline / Cylinder",
    ],
    verifications: ["Owner Identity Verified", "Phone Verified", "Availability Verified"],
    community: {
      transport: "Close to Khalishpur People's Mor and BIDC road. Easy connectivity to all Khulna.",
      waterlogging: "Paved municipal drainage, no standing water.",
      internet: "High speed broadband available.",
      noise: "Suburban family setting.",
      safety: "Peaceful residential neighborhood.",
      general: "Nearby parks, Khalishpur playground and clinic.",
    },
    landlord: {
      id: "l-khalishpur-1",
      name: "Kamal Hossain",
      avatar:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
      memberSince: "July 2024",
      publicContactVisible: true,
      phone: "01777777777",
      email: "kamal.khalishpur@demo.test",
      verified: true,
    },
    rating: 4.4,
    reviewCount: 3,
    createdAt: "2026-09-28T16:00:00Z",
    updatedAt: "2026-10-10T09:00:00Z",
  },
];

export interface TenantPreferences {
  preferredArea?: string;
  maxBudget?: number;
  preferredPropertyType?: string;
  minRooms?: number;
  requiredAmenities?: string[];
}

/**
 * Weighted Matching Algorithm strictly adhering to specification:
 * - Location: 30%
 * - Budget: 25%
 * - Property Type: 15%
 * - Rooms & Bathrooms: 10%
 * - Amenities: 15%
 * - Availability: 5%
 */
export function calculateMatchBreakdown(
  property: PropertyItem,
  preferences?: TenantPreferences | null,
): MatchBreakdown {
  if (!preferences || Object.keys(preferences).length === 0) {
    return {
      overallPercentage: 0,
      locationScore: 0,
      budgetScore: 0,
      propertyTypeScore: 0,
      roomsAndBathsScore: 0,
      amenitiesScore: 0,
      availabilityScore: 0,
      hasTenantPreferences: false,
    };
  }

  // 1. Location (30%)
  let locationScore = 0;
  if (!preferences.preferredArea || preferences.preferredArea === "All Areas") {
    locationScore = 25; // Good default when not restricting
  } else if (property.area.toLowerCase().includes(preferences.preferredArea.toLowerCase())) {
    locationScore = 30;
  } else {
    locationScore = 10;
  }

  // 2. Budget (25%)
  let budgetScore = 0;
  if (!preferences.maxBudget) {
    budgetScore = 20;
  } else if (property.rent <= preferences.maxBudget) {
    budgetScore = 25;
  } else {
    const diff = (property.rent - preferences.maxBudget) / preferences.maxBudget;
    budgetScore = Math.max(0, Math.round(25 * (1 - diff * 2)));
  }

  // 3. Property Type (15%)
  let propertyTypeScore = 0;
  if (!preferences.preferredPropertyType) {
    propertyTypeScore = 12;
  } else if (
    property.propertyType.toLowerCase() === preferences.preferredPropertyType.toLowerCase()
  ) {
    propertyTypeScore = 15;
  } else {
    propertyTypeScore = 5;
  }

  // 4. Rooms & Bathrooms (10%)
  let roomsAndBathsScore = 0;
  const targetRooms = preferences.minRooms || 1;
  if (property.rooms >= targetRooms) {
    roomsAndBathsScore = 10;
  } else {
    roomsAndBathsScore = Math.round(10 * (property.rooms / targetRooms));
  }

  // 5. Amenities (15%)
  let amenitiesScore = 0;
  const required = preferences.requiredAmenities || [];
  if (required.length === 0) {
    amenitiesScore = 12;
  } else {
    const matched = required.filter((a) => property.amenities.includes(a)).length;
    amenitiesScore = Math.round(15 * (matched / required.length));
  }

  // 6. Availability (5%)
  const availabilityScore = property.availability === "Available" ? 5 : 0;

  const overallPercentage =
    locationScore +
    budgetScore +
    propertyTypeScore +
    roomsAndBathsScore +
    amenitiesScore +
    availabilityScore;

  return {
    overallPercentage: Math.min(100, Math.max(0, overallPercentage)),
    locationScore,
    budgetScore,
    propertyTypeScore,
    roomsAndBathsScore,
    amenitiesScore,
    availabilityScore,
    hasTenantPreferences: true,
  };
}

export const mockProperties = {
  async list(filter: PropertyFilter = {}): Promise<PropertyListResponse> {
    await new Promise((r) => setTimeout(r, 60)); // Fast mock delay
    let results = [...MOCK_PROPERTIES];

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.banglaTitle?.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.exactAddress.toLowerCase().includes(q),
      );
    }

    if (filter.area && filter.area !== "All Areas") {
      results = results.filter((p) => p.area.toLowerCase().includes(filter.area!.toLowerCase()));
    }

    if (filter.propertyType) {
      results = results.filter((p) => p.propertyType === filter.propertyType);
    }

    if (filter.rentalType) {
      results = results.filter((p) => p.rentalType === filter.rentalType);
    }

    if (filter.minRent !== undefined) {
      results = results.filter((p) => p.rent >= filter.minRent!);
    }

    if (filter.maxRent !== undefined) {
      results = results.filter((p) => p.rent <= filter.maxRent!);
    }

    if (filter.rooms !== undefined) {
      results = results.filter((p) => p.rooms >= filter.rooms!);
    }

    if (filter.bathrooms !== undefined) {
      results = results.filter((p) => p.bathrooms >= filter.bathrooms!);
    }

    if (filter.furnishedStatus) {
      results = results.filter((p) => p.furnishedStatus === filter.furnishedStatus);
    }

    if (filter.availability) {
      results = results.filter((p) => p.availability === filter.availability);
    }

    if (filter.verifiedOnly) {
      results = results.filter((p) => p.verifications.length > 0);
    }

    if (filter.amenities && filter.amenities.length > 0) {
      results = results.filter((p) => filter.amenities!.every((a) => p.amenities.includes(a)));
    }

    // Sorting
    if (filter.sortBy === "price_asc") {
      results.sort((a, b) => a.rent - b.rent);
    } else if (filter.sortBy === "price_desc") {
      results.sort((a, b) => b.rent - a.rent);
    } else if (filter.sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: newest
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const page = filter.page || 1;
    const limit = filter.limit || 9;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
      areas: KHULNA_AREAS.slice(1), // Exclude "All Areas"
    };
  },

  async getById(id: string): Promise<PropertyItem | null> {
    await new Promise((r) => setTimeout(r, 40));
    return MOCK_PROPERTIES.find((p) => p.id === id) || null;
  },

  async getFeatured(): Promise<PropertyItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    return MOCK_PROPERTIES.slice(0, 4);
  },
};
