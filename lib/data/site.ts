/**
 * Practice details, exactly as the live site states them (footer, contact
 * block, map links). Used for the site-wide Dentist schema and the menu's
 * phone link. Editable in /cms under Site settings.
 */
export const fallbackSettings = {
  name: "Valencia Smile Expert",
  legalName: "Valencia Smile Expert",
  phone: "(661) 254-5200",
  email: "info@valenciasmileexpert.com",
  street: "27420 Tourney Rd, Suite 240",
  city: "Santa Clarita",
  region: "CA",
  postalCode: "91355",
  // From the live site's "Get Directions" map link.
  latitude: 34.421619,
  longitude: -118.5780025,
  mapsUrl: "https://maps.app.goo.gl/zf8fsL8TG72B2QZh9",
  bookingUrl: "https://book2.getweave.com/657e8080-2ad9-44fa-8cfb-2c06a59cd7a7/request-appointment?source=WEBSITE",
  // "Monday – Friday: 8am – 5pm, Saturday & Sunday Closed" on every contact block.
  hours: [
    { day: "Monday", opens: "08:00", closes: "17:00" },
    { day: "Tuesday", opens: "08:00", closes: "17:00" },
    { day: "Wednesday", opens: "08:00", closes: "17:00" },
    { day: "Thursday", opens: "08:00", closes: "17:00" },
    { day: "Friday", opens: "08:00", closes: "17:00" },
    { day: "Saturday", opens: "", closes: "" },
    { day: "Sunday", opens: "", closes: "" },
  ],
  // The footer's social icons, as linked on the live site.
  social: [
    "https://www.facebook.com/iHeartDDS1/",
    "https://x.com/iHeartDDS1",
    "https://www.instagram.com/Valenciasmileexpert/",
    "https://www.linkedin.com/in/iHeartDDS1",
  ],
  logo: { src: "/images/uploads/2025/05/valencia-logo.png", alt: "Valencia Smile Expert", width: 461, height: 96 },
  image: { src: "/images/uploads/2025/07/hero-image.png", alt: "Dr. Neda Moezzi, DDS", width: 680, height: 802 },
};

export type SiteSettings = typeof fallbackSettings;
