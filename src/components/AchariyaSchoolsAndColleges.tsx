import React from "react";

import school1 from "@/assets/images/achariya-schools-colleges/aasc-1-removebg-preview.webp";
import school2 from "@/assets/images/achariya-schools-colleges/absm-removebg-preview.webp";
import school3 from "@/assets/images/achariya-schools-colleges/acchm-300x113-removebg-preview.webp";
import school4 from "@/assets/images/achariya-schools-colleges/acet-removebg-preview.webp";
import school5 from "@/assets/images/achariya-schools-colleges/aklavya-removebg-preview.webp";
import school6 from "@/assets/images/achariya-schools-colleges/ssv-removebg-preview.webp";

const schoolsAndCollegesData = {
  title: "Our Schools And Colleges",
  logos: [school1.src, school2.src, school3.src, school4.src, school5.src, school6.src],
};

/* ================= TYPES ================= */
interface AchariyaSchoolsAndCollegesProps {
  overrideData?: {
    title?: string;
    logos?: string[];
  };
}

/* ================= COMPONENT ================= */
const AchariyaSchoolsAndColleges: React.FC<
  AchariyaSchoolsAndCollegesProps
> = ({ overrideData }) => {
  const finalData = {
    ...schoolsAndCollegesData,
    ...overrideData,
  };

  return (
    <section className="w-full  overflow-hidden">
      <div className=" mx-auto px-4">
     

        {/* Logo Scroller */}
        <div className=" relative">
          <RowScroller logos={finalData.logos || []} speed="18s" />
        </div>
      </div>

      {/* Component Scoped Styles */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </section>
  );
};

/* ================= ROW SCROLLER ================= */
const RowScroller = ({
  logos,
  speed = "18s",
}: {
  logos: string[];
  speed?: string;
}) => {
  if (!logos?.length) return null;

  return (
    <div className="overflow-hidden relative w-full">
      {/* Left Fade */}
      <div className="absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />

      {/* Right Fade */}
      <div className="absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />

      {/* Scrolling Track */}
      <div
        className="flex items-center gap-12 w-max animate-marquee"
        style={{
          animationDuration: speed,
        }}
      >
        {[...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className="flex items-center justify-center min-w-[260px] h-32 bg-white rounded-2xl border border-gray-100 shadow-sm px-6"
          >
            <img
              src={logo}
              alt={`school-logo-${i}`}
              className="max-w-full max-h-28 object-contain  transition duration-300"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchariyaSchoolsAndColleges;