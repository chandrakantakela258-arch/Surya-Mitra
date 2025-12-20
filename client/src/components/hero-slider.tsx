import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import solarRoof1 from "@assets/stock_images/solar_panels_on_roof_434b8cd5.jpg";
import solarRoof2 from "@assets/stock_images/solar_panels_on_roof_0bbf267f.jpg";
import solarRoof3 from "@assets/stock_images/solar_panels_on_roof_d57dcf73.jpg";
import solarInstall1 from "@assets/stock_images/solar_panel_installa_2cf01698.jpg";
import solarInstall2 from "@assets/stock_images/solar_panel_installa_900f77e8.jpg";

const slides = [
  {
    image: solarRoof1,
    title: "Rooftop Solar for Every Home",
    subtitle: "Transform your roof into a power plant"
  },
  {
    image: solarInstall1,
    title: "Professional Installation",
    subtitle: "Expert technicians ensuring quality work"
  },
  {
    image: solarRoof2,
    title: "Save on Electricity Bills",
    subtitle: "Generate your own clean energy"
  },
  {
    image: solarInstall2,
    title: "Trusted Service Network",
    subtitle: "Pan-India installation partners"
  },
  {
    image: solarRoof3,
    title: "25+ Years of Clean Energy",
    subtitle: "Long-lasting solar panels with warranty"
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
    <div className="relative w-full rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative">
              <div className="relative aspect-[16/9] md:aspect-[21/9]">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                  <h3 className="text-white text-xl md:text-3xl font-bold mb-2">
                    {slide.title}
                  </h3>
                  <p className="text-white/80 text-sm md:text-lg">
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
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
        onClick={scrollPrev}
        data-testid="button-slider-prev"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
        onClick={scrollNext}
        data-testid="button-slider-next"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex
                ? "bg-white w-6"
                : "bg-white/50 hover:bg-white/70"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            data-testid={`button-slider-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
