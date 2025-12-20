import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import indianHome from "@assets/generated_images/indian_home_with_solar_panels.png";
import indianFamily from "@assets/generated_images/indian_family_with_solar_home.png";
import solarInstallation from "@assets/generated_images/solar_installation_in_india.png";
import indianBungalow from "@assets/generated_images/indian_bungalow_with_solar.png";
import indianColony from "@assets/generated_images/indian_colony_with_solar_roofs.png";

const slides = [
  {
    image: indianHome,
    title: "PM Surya Ghar Yojana",
    subtitle: "Free electricity for 1 crore households across India"
  },
  {
    image: indianFamily,
    title: "Power Your Home with Sunlight",
    subtitle: "Join lakhs of Indian families saving on electricity"
  },
  {
    image: solarInstallation,
    title: "Expert Installation Team",
    subtitle: "Professional technicians across Bihar, Jharkhand, UP & Odisha"
  },
  {
    image: indianBungalow,
    title: "Up to Rs 78,000 Subsidy",
    subtitle: "Government subsidy on DCR solar panels for your home"
  },
  {
    image: indianColony,
    title: "Solar for Every Neighborhood",
    subtitle: "Building a greener India, one rooftop at a time"
  }
];

export function HeroSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(autoplay);
  }, [emblaApi]);

  return (
    <div className="relative w-full overflow-hidden">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative">
              <div className="relative h-[50vh] md:h-[70vh] lg:h-[80vh]">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 lg:p-20">
                  <h3 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold mb-3 drop-shadow-lg">
                    {slide.title}
                  </h3>
                  <p className="text-white/90 text-base md:text-xl lg:text-2xl drop-shadow-md max-w-3xl">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 text-white backdrop-blur-sm w-12 h-12 md:w-14 md:h-14"
        onClick={scrollPrev}
        data-testid="button-slider-prev"
      >
        <ChevronLeft className="w-8 h-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 text-white backdrop-blur-sm w-12 h-12 md:w-14 md:h-14"
        onClick={scrollNext}
        data-testid="button-slider-next"
      >
        <ChevronRight className="w-8 h-8" />
      </Button>

      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-3 rounded-full transition-all ${
              index === selectedIndex
                ? "bg-white w-10"
                : "bg-white/50 w-3"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            data-testid={`button-slider-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
