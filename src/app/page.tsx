"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  X,
  Phone,
  Mail,
  MapPin,
  Plus,
  Minus,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  Users,
  Shield,
  Video,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AchariyaSchoolsAndColleges from "@/components/AchariyaSchoolsAndColleges";
import image from "@/assets/images/image.png"
import x from "@/assets/images/sm/3dicons-x-front-color.png";
import insta from "@/assets/images/sm/3dicons-instagram-front-color.png";
import fb from "@/assets/images/sm/3dicons-facebook-front-color.png";
import linkedin from "@/assets/images/sm/3dicons-linkedin-front-color.png";
import youtube from "@/assets/images/sm/3dicons-youtube-front-color.png"
import hero from "@/assets/images/achariyanew1-scaled.avif"
import mobileHero from "@/assets/images/Artboard-1.avif"
// Background images for the Hero carousel slider
const carouselSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600",
    title: "Secure Online Assessment Portal",
    subtitle: "Modern Evaluation, Trusted Integrity",
    description: "Welcome to the Achariya Group's advanced online examination and assessment system. Built to deliver seamless, secure, and reliable evaluations."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1600",
    title: "Intelligent Online Proctoring",
    subtitle: "Conduct Exams with Zero Compromise",
    description: "Leverage automated surveillance, copy-paste prevention, browser locking, and real-time monitoring to maintain absolute academic integrity."
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600",
    title: "Next-Gen Diagnostic Reporting",
    subtitle: "Data-Driven Academic Insights",
    description: "Empower educators with immediate grading, comprehensive dashboard metrics, performance analysis, and automated reports."
  }
];

// Schools and Colleges data
const institutions = [
  {
    name: "Achariya Arts and Science College",
    abbreviation: "AASC",
    description: "A premier hub for undergraduate and postgraduate education, training students in science, humanities, and commerce with high academic rigor.",
    icon: BookOpen
  },
  {
    name: "Achariya College of Engineering & Technology",
    abbreviation: "ACET",
    description: "Driving engineering excellence and software innovation through hands-on technical labs, practical assignments, and digitized examinations.",
    icon: Layers
  },
  {
    name: "Achariya School of Business",
    abbreviation: "ASB",
    description: "Shaping the industry leaders of tomorrow by testing real-world business case analyses, management strategies, and operational logic.",
    icon: Award
  },
  {
    name: "Achariya Teacher Training Institute",
    abbreviation: "ATTI",
    description: "Cultivating highly skilled pedagogical experts trained in contemporary teaching styles, student psychology, and modern educational tech.",
    icon: Users
  }
];

// FAQs data
const faqs = [
  {
    question: "How secure is the Achariya Online Exam Portal?",
    answer: "Our portal uses high-security proctoring mechanisms including strict fullscreen browser enforcement, copy-paste disables, question-shuffling, and web-camera logs to ensure all evaluations are completely honest and valid."
  },
  {
    question: "How do educators create and schedule examination papers?",
    answer: "Faculty members access their custom Educator Terminal where they can organize question banks, assign negative marking, schedule exam duration windows, and assign them directly to specific student cohorts."
  },
  {
    question: "Can candidate responses be saved in case of network disruptions?",
    answer: "Yes, the portal automatically autosaves active progress to local memory and syncs it securely with the central database the instant a network reconnect is made. You can resume your test immediately without starting over."
  },
  {
    question: "How and when are grades published?",
    answer: "Multiple-choice assessments are graded instantaneously. Subjective or written examinations are processed by faculty members on their terminal, after which results are dispatched to candidate dashboards."
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: "", email: "", mobile: "", subject: "", message: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Auto scroll carousel slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setTimeout(() => {
      setFormLoading(false);
      setFormSubmitted(true);
      setFormData({ name: "", email: "", mobile: "", subject: "", message: "" });
    }, 1500);
  };

  // Scroll to "Who We Are"
  const scrollToContent = () => {
    const element = document.getElementById("who-we-are");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Framer Motion Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen text-gray-900 font-sans flex flex-col justify-between relative overflow-hidden bg-transparent pt-20">

      {/* Brand Navbar identical to Careers Portal */}
      <header className="w-full bg-[#C72323] shadow-lg fixed top-0 left-0 z-50">
        <div className="container mx-auto px-6 py-1 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-wider">ACHARIYA</h1>
            <span className="text-[10px] text-white/80 font-bold tracking-widest uppercase border-l border-white/20 pl-3 hidden sm:inline">
              Online Exam Portal
            </span>
          </Link>
          <img
            src="/images/Achariya-Logo-01-scaled.avif"
            alt="Achariya Logo"
            className="w-20 h-auto object-contain py-1"
          />
        </div>
      </header>

      {/* Main Sections */}
      <main className="flex-1 w-full">

        {/* HERO SECTION WITH PREMIUM GLASS UI */}
        {/* <section className="relative h-full py-20 flex items-center overflow-hidden border-b border-white/10 bg-black">

          <div className="absolute inset-0 z-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${carouselSlides[currentSlide].image})`,
                }}
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/85" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />
          </div>

         
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-[#C72323]/10 blur-[160px] rounded-full z-10 pointer-events-none" />

          <div
            className="absolute inset-0 opacity-[0.04] z-10"
            style={{
              backgroundImage: `
        linear-gradient(to right, white 1px, transparent 1px),
        linear-gradient(to bottom, white 1px, transparent 1px)
      `,
              backgroundSize: "80px 80px",
            }}
          />

          <button
            onClick={handlePrevSlide}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-14 h-14 border border-white/10 bg-white/5 backdrop-blur-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
            style={{ borderRadius: "9999px" }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={handleNextSlide}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-14 h-14 border border-white/10 bg-white/5 backdrop-blur-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
            style={{ borderRadius: "9999px" }}
          >
            <ChevronRight size={20} />
          </button>
          <div className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-12 pb-12">
            <motion.div
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="grid lg:grid-cols-12 gap-14 items-center">

                <div className="lg:col-span-7">

                  <div className="inline-flex items-center gap-3 px-5 py-2 border border-white/10 bg-white/5 backdrop-blur-xl mb-8">
                    <span className="w-2 h-2 bg-[#C72323] animate-pulse rounded-full" />

                    <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-200">
                      {carouselSlides[currentSlide].subtitle}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl max-w-2xl lg:text-6xl leading-[0.95] font-black tracking-[-0.05em] text-white">
                    {carouselSlides[currentSlide].title
                      .split(" ")
                      .map((word, i) => {
                        const isHighlight =
                          word === "Assessment" ||
                          word === "Proctoring" ||
                          word === "Reporting" ||
                          word === "Exam";

                        return (
                          <span
                            key={i}
                            className={
                              isHighlight
                                ? "text-[#C72323]"
                                : "text-white"
                            }
                          >
                            {word}{" "}
                          </span>
                        );
                      })}
                  </h1>

                  <div className="w-28 h-[2px] bg-gradient-to-r from-[#C72323] to-transparent mt-10 mb-8" />

                  <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl font-medium">
                    {carouselSlides[currentSlide].description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-10">

                    <button
                      onClick={scrollToContent}
                      className="group bg-[#C72323] hover:bg-[#b01f1f] text-white px-8 py-4 font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 cursor-pointer border-none shadow-[0_10px_40px_rgba(199,35,35,0.35)]"
                      style={{ borderRadius: "8px" }}
                    >
                      Explore Platform

                      <ArrowRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </button>

                    <button
                      onClick={() => {
                        const contactSection = document.getElementById("contact");

                        if (contactSection) {
                          contactSection.scrollIntoView({
                            behavior: "smooth",
                          });
                        }
                      }}
                      className="px-8 py-4 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl text-white text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 cursor-pointer"
                      style={{ borderRadius: "8px" }}
                    >
                      Get Support
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">

                  <div className="grid grid-cols-2 gap-5">

                    {[
                      {
                        value: "1.2M+",
                        label: "Assessments Completed",
                      },
                      {
                        value: "45K+",
                        label: "Concurrent Candidates",
                      },
                      {
                        value: "< 2 Secs",
                        label: "Evaluation Latency",
                      },
                      {
                        value: "99.99%",
                        label: "Infrastructure Reliability",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="relative overflow-hidden border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-7 min-h-[200px] flex flex-col justify-between"
                        style={{
                          borderRadius: "8px",
                        }}
                      >

                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

                        <div className="relative z-10 w-12 h-[2px] bg-[#C72323]" />

                        <div className="relative z-10 space-y-4">
                          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                            {stat.value}
                          </h3>

                          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-bold leading-relaxed">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>

              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10" />
        </section> */}




        <section>
          <img src={hero.src} alt="" className="w-full md:block hidden border-b border-gray-200 object-fit" />
          <img src={mobileHero.src} alt="" className="w-full md:hidden block border-b border-gray-200 object-fit" />
        </section>



        {/* WHO WE ARE SECTION */}
        <section id="who-we-are" className="bg-transparent py-12  border-gray-300">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-12 gap-12 items-center">

              {/* Left Column Content */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="md:col-span-6 space-y-6"
              >
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C72323] block">
                    WHO WE ARE
                  </span>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                    Pioneering Digital Evaluation for Academic Excellence
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center md:text-left">
                  The ACHARIYA Online Assessment Portal is a modern, high-integrity assessment infrastructure designed to handle complex academic grading, practice tests, and recruitment screenings. We align advanced educational analytics with a flexible, user-friendly portal.
                </p>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center md:text-left">
                  By digitizing evaluations across our cluster of schools and universities, we minimize evaluation latency, streamline reporting, and provide instant insights to students and faculty, ensuring academic advancement is both secure and measurable.
                </p>

                <div className="grid grid-cols-3 gap-6 pt-4">
                  <div className="md:border-l-2 border-[#C72323] md:pl-4 space-y-1 text-center md:text-left">
                    <h4 className="text-2xl font-bold text-gray-900">100%</h4>
                    <p className="md:text-xs text-[10px] font-bold text-gray-500 uppercase tracking-wider">Secure Infrastructure</p>
                  </div>
                  <div className="md:border-l-2 border-[#DE2589] md:pl-4 space-y-1 text-center md:text-left">
                    <h4 className="text-2xl font-bold text-gray-900">10K+</h4>
                    <p className="md:text-xs text-[10px] font-bold text-gray-500 uppercase tracking-wider">Students Registered</p>
                  </div>
                  <div className="md:border-l-2 border-[#20407D] md:pl-4 space-y-1 text-center md:text-left">
                    <h4 className="text-2xl font-bold text-gray-900">Instant</h4>
                    <p className="md:text-xs text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grading & Analytics</p>
                  </div>
                </div>
              </motion.div>
              <div className="md:col-span-1"></div>

              {/* Right Column Features Cards */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="md:col-span-5 space-y-4"
              >
                {[
                  {
                    title: "Advanced Remote Proctoring",
                    desc: "Rigorous anti-cheating framework that monitors navigation and environment to ensure genuine scores.",
                    icon: Shield,
                    color: "[#C72323]"
                  },
                  {
                    title: "AI-Powered Evaluation Engine",
                    desc: "Automated grading workflows with intelligent analytics for faster and more accurate assessment processing.",
                    icon: Brain,
                    color: "[#20407D]"
                  },
                  {
                    title: "Seamless Scaling Capabilities",
                    desc: "Built to host thousands of students concurrently without server dropouts or rendering delays.",
                    icon: Layers,
                    color: "[#20407D]"
                  },
                  {
                    title: "Robust Performance Dashboards",
                    desc: "Insightful metrics showing progress, strengths, and weaknesses for students and course teachers.",
                    icon: Sparkles,
                    color: "[#DE2589]"
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeInUp}
                    className={`bg-white border border-gray-200 md:border-l-4 border-t-4 p-5 md:border-l-${item.color} md:border-t-gray-200 border-t-${item.color} shadow-sm hover:shadow-md transition-shadow rounded-none`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-start justify-center gap-4 md:items-start items-center">
                      <div className="p-2.5 bg-gray-50 text-gray-700 rounded-none shrink-0 border border-gray-150">
                        <item.icon size={20} className="text-[#20407D]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-900 text-center md:text-left">{item.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed text-center md:text-left">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>


        {/* OUR SCHOOLS & COLLEGES */}
        <section className="bg-transparent backdrop-filter backdrop-blur-sm border-gray-300 py-16">
          <div className="container mx-auto px-6 space-y-12">

            {/* Section Header */}
            {/* <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C72323] block">
                OUR ACADEMIC COMMUNITY
              </span>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                Institutions Powered by Our Portal
              </h3>
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                ACHARIYA Assessment Portal brings centralized digital examination services to our diverse educational ecosystem, promoting uniform, high-standard evaluation benchmarks.
              </p>
            </div> */}


            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="w-full"
            >
              <AchariyaSchoolsAndColleges />
            </motion.div>
          </div>
        </section>

        {/* OUR INFRASTRUCTURE (MAX SCREEN VIDEO BANNER)*/}
        <section className="py-12  bg-transparent">

          {/* Full Screen Video Container / Thumbnail */}
          <div className="w-full flex justify-center px-6">
            <div
              className="w-full container h-[75vh] min-h-[500px] relative bg-black overflow-hidden shadow-lg"
              style={{ borderRadius: "8px" }}
            >
              {isPlayerOpen ? (
                <iframe
                  src="https://www.youtube.com/embed/9No-FiEInyA?autoplay=1"
                  title="Achariya Digital Exam Infrastructure Walkthrough"
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                  {/* Cover image as background */}
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600')`
                    }}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/45 z-10" />

                  {/* Pulsing Play Button (center of thumbnail) */}
                  <button
                    onClick={() => setIsPlayerOpen(true)}
                    className="z-20 w-20 h-20 bg-[#C72323] hover:bg-[#b01f1f] text-white flex items-center justify-center border-none shadow-2xl relative group cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{ borderRadius: "9999px" }}
                    aria-label="Play video walkthrough inline"
                  >
                    {/* Custom CSS pulse effect */}
                    <span
                      className="absolute inset-0 border border-[#C72323]/50 animate-ping"
                      style={{ borderRadius: "9999px" }}
                    />
                    <Play size={30} className="fill-current ml-1.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* FAQ ACCORDION SECTION */}
        <section className="bg-transparent container mx-auto py-12">
          <div className="grid  md:grid-cols-2 grid-cols-1 gap-12 items-center">
            <div className="cols-span-6">
              <div className=" mx-auto px-6 space-y-12">

                <div className="md:text-left text-center space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C72323] block">
                    COMMON QUESTIONS
                  </span>
                  <h3 className="lg:text-5xl md:text-4xl text-3xl font-bold tracking-tight text-gray-900">
                    Frequently Asked Questions
                  </h3>
                  <p className="text-sm text-gray-500 max-w-lg mx-auto md:mx-0">
                    Need details about system functionality, reliability, or login rules? Find answers to our most popular questions below.
                  </p>
                </div>

                <div className="cols-span-6 md:hidden block">
                  <div className="w-full h-full ">
                    <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600" alt="faq image" className="w-full h-full object-fit rounded-lg" />
                  </div>
                </div>

                {/* Accordion list */}
                <div className="space-y-4 pt-4">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div
                        key={index}
                        className="border border-gray-300 bg-white shadow-sm transition-colors duration-200"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="w-full px-6 py-4.5 flex justify-between items-center text-left font-bold text-sm sm:text-base text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer rounded-none border-none"
                        >
                          <span className="pr-4">{faq.question}</span>
                          <span className="text-[#C72323] shrink-0 p-1 bg-gray-50 border border-gray-250">
                            {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-150">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="cols-span-6 md:block hidden">
              <div className="w-full h-full ">
                <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600" alt="faq image" className="w-full h-full object-fit rounded-lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:block hidden">
          <img src={image.src} alt="" className="w-full border-b border-gray-200 object-fit" />
        </section>

        {/* CONTACT SECTION */}
        <section className="bg-transparent py-12 border-b border-gray-300 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-12 items-start">

              {/* Left Side: Contact details */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="lg:col-span-6 space-y-8"
              >
                <div className="space-y-3 md:text-left text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C72323] block">
                    GET IN TOUCH
                  </span>
                  <h3 className="lg:text-5xl md:text-4xl text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                    Contact Us
                  </h3>
                  <p className="text-sm max-w-xl text-gray-500 leading-relaxed">
                    Have any administrative or technical questions? Get in touch with our technical support team or visit our head office.
                  </p>
                </div>

                <div className="space-y-6">

                  {/* Address */}
                  <div className="flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left">
                    <div className="p-3 rounded-full bg-[#C72323]/5 border border-[#C72323]/10 text-[#C72323] shrink-0" style={{ borderRadius: "100%" }}>
                      <MapPin size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Main Campus Location</h4>
                      <p className="text-sm text-gray-900 font-semibold leading-relaxed">
                        ACHARIYA Educational Public Trust,
                        Villianur Bypass Road, <br />
                        Villianur, Puducherry - 605010, India.
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left">
                    <div className="p-3 bg-[#20407D]/5 border border-[#20407D]/10 text-[#20407D] shrink-0" style={{ borderRadius: "100%" }}>
                      <Phone size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Admissions & Helpdesk</h4>
                      <p className="text-sm text-gray-900 font-semibold break-words">
                        +91 413 220 5301
                        <span className="hidden sm:inline text-gray-400 font-normal mx-2">/</span>
                        <br className="sm:hidden" />
                        220 5302
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left">
                    <div className="p-3 rounded-full bg-[#DE2589]/5 border border-[#DE2589]/10 text-[#DE2589] shrink-0 " style={{ borderRadius: "100%" }}>
                      <Mail size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Corporate Correspondence</h4>
                      <p className="text-sm text-gray-900 font-semibold break-all">
                        info@achariya.org
                        <span className="hidden sm:inline text-gray-400 font-normal mx-2">/</span>
                        <br className="sm:hidden" />
                        support@achariya.org
                      </p>
                    </div>
                  </div>
                <div className="mt-8">
                    {/* <h3 className="lg:text-4xl md:text-left text-center md:text-3xl mb-2 underline underline-offset-6 decoration-[#C1120C] text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                    Follow us on
                  </h3> */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-center md:justify-start">
                    
                    <a href="https://www.instagram.com/achariya_world_class_education?igsh=czVseWtjZ3drMHpn" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 hover:opacity-80 transition-opacity block">
                      <img src={insta.src} alt="Instagram" className="w-full h-full object-contain" />
                    </a>
                    <a href="https://www.facebook.com/share/1679nE6dpg/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 hover:opacity-80 transition-opacity block">
                      <img src={fb.src} alt="Facebook" className="w-full h-full object-contain" />
                    </a>
                    <a href="https://www.youtube.com/c/AchariyaWorldClassEducation" target="_blank" rel="noopener noreferrer" className="w-18 h-18 md:w-22 md:h-22 hover:opacity-80 transition-opacity block">
                      <img src={youtube.src} alt="Facebook" className="w-full h-full object-contain" />
                    </a>
                    <a href="https://www.linkedin.com/company/achariya-world-class-institutions" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 hover:opacity-80 transition-opacity block">
                      <img src={linkedin.src} alt="LinkedIn" className="w-full h-full object-contain" />
                    </a>
                    <a href="https://x.com/achariyaschools" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 hover:opacity-80 transition-opacity block">
                      <img src={x.src} alt="X" className="w-full h-full object-contain" />
                    </a>
                  </div>

                </div>
                </div>

                {/* Office hours note */}
                {/* <div className="p-4 bg-white border border-gray-200 rounded-none text-xs text-gray-600 leading-relaxed shadow-sm">
                  <span className="font-bold text-gray-900 block mb-1">Standard Support Hours</span>
                  Monday through Saturday: 09:00 AM – 05:30 PM (IST). Excludes Sunday and official academic holidays.
                </div> */}
              </motion.div>

              {/* Right Side: Form */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="lg:col-span-6 bg-white border border-gray-300 p-5 sm:p-8 shadow-md rounded-none"
              >


                {formSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-green-50 border border-green-200 text-green-800 space-y-3 rounded-none"
                  >
                    <h5 className="font-bold text-sm">Thank you! Your message has been sent successfully.</h5>
                    <p className="text-xs leading-relaxed">
                      Our portal administrators have received your inquiry. We will contact you back at the email address provided within 24-48 business hours.
                    </p>
                    <button
                      onClick={() => setFormSubmitted(false)}
                      className="text-xs font-bold text-[#20407D] hover:underline cursor-pointer border-none bg-transparent p-0"
                    >
                      Send another query
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">

                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                          Your Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="input-field rounded-none h-11"
                          placeholder="e.g. John Doe"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="input-field rounded-none h-11"
                          placeholder="e.g. john@example.com"
                        />
                      </div>

                    </div>

                    {/* MoBILE */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="mobile"
                        required
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="input-field rounded-none h-11"
                        placeholder="e.g. +91 1234567890"
                      />
                    </div>
                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Subject / Query Type
                      </label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="input-field rounded-none h-11"
                        placeholder="e.g. Assessment Login Issue / Portal Registration Request"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Detail Message
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="input-field rounded-none min-h-[120px]"
                        placeholder="Describe your issue or query details as clearly as possible..."
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full bg-[#20407D] hover:bg-[#1a3566] text-white font-bold py-3.5 rounded-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
                    >
                      {formLoading ? (
                        "Sending message..."
                      ) : (
                        <>
                          Send Message <Send size={14} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>

            </div>
          </div>
        </section>

      </main>


      {/* Footer identical to Careers portal */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center mt-auto border-t border-gray-800 relative z-10">
        <p className="text-white font-semibold mb-2">ACHARIYA Online Exam Portal</p>
        <p className="text-xs">
          © {new Date().getFullYear()} Achariya Group. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
