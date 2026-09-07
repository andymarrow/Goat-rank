/**
 * Starter arena catalogue.
 *
 * These are the contests from the original lib/mockData.ts fixtures, kept as a
 * seed catalogue rather than as render-time constants. Seeding turns each into
 * a real demo room, so it gets a working detail page, appears in the feed, and
 * is editable and deletable from the admin console.
 *
 * The fixtures carried invented pools in the tens of thousands. Those are not
 * reproduced — a seeded arena fills its pool from bot cries at believable
 * amounts instead, so the site looks alive without displaying six-figure sums
 * nobody paid.
 */

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

export type StarterArena = {
  title: string;
  category: string;
  roomType: "1v1" | "global";
  featured?: boolean;
  cries: number;
  contenders: { name: string; image?: string; color?: string }[];
};

export const STARTER_ARENAS: StarterArena[] = [
  {
    title: "Ronaldo vs. Messi: Ultimate GOAT",
    category: "Sports",
    roomType: "1v1",
    featured: true,
    cries: 12,
    contenders: [
      { name: "Cristiano Ronaldo", image: U("photo-1508098682722-e99c43a406b2"), color: "#E5E7EB" },
      { name: "Lionel Messi", image: U("photo-1518091043644-c1d4457512c6"), color: "#3B82F6" },
    ],
  },
  {
    title: "iPhone 16 Pro vs. Galaxy S25 Ultra",
    category: "Tech",
    roomType: "1v1",
    cries: 9,
    contenders: [
      { name: "iPhone 16 Pro", image: U("photo-1511707171634-5f897ff02aa9"), color: "#94A3B8" },
      { name: "Galaxy S25 Ultra", image: U("photo-1610945265064-0e34e5519bbf"), color: "#6366F1" },
    ],
  },
  {
    title: "LeBron James vs. Michael Jordan",
    category: "Sports",
    roomType: "1v1",
    featured: true,
    cries: 11,
    contenders: [
      { name: "LeBron James", image: U("photo-1546519638-68e109498ffc"), color: "#FACC15" },
      { name: "Michael Jordan", image: U("photo-1519766304817-4f37bda74a29"), color: "#E5484D" },
    ],
  },
  {
    title: "Kendrick Lamar vs. Drake",
    category: "Music",
    roomType: "1v1",
    cries: 10,
    contenders: [
      { name: "Kendrick Lamar", image: U("photo-1511671782779-c97d3d27a1d4"), color: "#FF7A00" },
      { name: "Drake", image: U("photo-1470225620780-dba8ba36b745"), color: "#0EA5E9" },
    ],
  },
  {
    title: "Porsche 911 GT3 RS vs. Ferrari 296 GTB",
    category: "Cars",
    roomType: "1v1",
    cries: 7,
    contenders: [
      { name: "Porsche GT3 RS", image: U("photo-1614162692292-7ac56d7f7f1e"), color: "#10B981" },
      { name: "Ferrari 296 GTB", image: U("photo-1583121274602-3e2820c69888"), color: "#FF3B30" },
    ],
  },
  {
    title: "PlayStation 5 Pro vs. Xbox Series X",
    category: "Gaming",
    roomType: "1v1",
    cries: 8,
    contenders: [
      { name: "PS5 Pro", image: U("photo-1606813907291-d86efa9b94db"), color: "#2563EB" },
      { name: "Xbox Series X", image: U("photo-1621259182978-fbf93132d53d"), color: "#84CC16" },
    ],
  },
  {
    title: "Greatest Footballer of All Time",
    category: "Sports",
    roomType: "global",
    featured: true,
    cries: 14,
    contenders: [
      { name: "Lionel Messi", image: U("photo-1518091043644-c1d4457512c6"), color: "#3B82F6" },
      { name: "Cristiano Ronaldo", image: U("photo-1508098682722-e99c43a406b2"), color: "#E5484D" },
      { name: "Pelé", color: "#FACC15" },
      { name: "Diego Maradona", color: "#14B8A6" },
    ],
  },
  {
    title: "Ultimate Sci-Fi Movie Franchise",
    category: "Movies",
    roomType: "global",
    cries: 10,
    contenders: [
      { name: "Star Wars", image: U("photo-1534447677768-be436bb09401"), color: "#FACC15" },
      { name: "Interstellar", image: U("photo-1451187580459-43490279c0fa"), color: "#3B82F6" },
      { name: "The Matrix", color: "#10B981" },
    ],
  },
  {
    title: "Best Electric Vehicle of 2026",
    category: "Cars",
    roomType: "global",
    cries: 8,
    contenders: [
      { name: "Tesla Model S Plaid", image: U("photo-1617788138017-80ad40651399"), color: "#E5484D" },
      { name: "Porsche Taycan Turbo GT", image: U("photo-1614162692292-7ac56d7f7f1e"), color: "#10B981" },
    ],
  },
  {
    title: "Most Influential Tech Founder",
    category: "Tech",
    roomType: "global",
    cries: 9,
    contenders: [
      { name: "Steve Jobs", image: U("photo-1511707171634-5f897ff02aa9"), color: "#94A3B8" },
      { name: "Jensen Huang", color: "#10B981" },
      { name: "Elon Musk", color: "#E5484D" },
    ],
  },
  {
    title: "Best Action RPG of the Decade",
    category: "Gaming",
    roomType: "global",
    cries: 9,
    contenders: [
      { name: "Elden Ring", image: U("photo-1542751371-adc38448a05e"), color: "#FACC15" },
      { name: "God of War Ragnarok", color: "#3B82F6" },
      { name: "Black Myth Wukong", color: "#FF7A00" },
    ],
  },
];
