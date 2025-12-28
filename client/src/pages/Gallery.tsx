import { useState } from "react";
import { X, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: string;
  serviceType: string;
}

const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: "/gallery/haircut-1.jpg",
    alt: "Moderne herreklipp med teksturert topp",
    category: "Herreklipp",
    serviceType: "haircut",
  },
  {
    id: 2,
    src: "/gallery/haircut-2.jpg",
    alt: "Balayage hårfarge med myke bølger",
    category: "Hårfarge",
    serviceType: "color",
  },
  {
    id: 3,
    src: "/gallery/beard-styling.jpg",
    alt: "Profesjonell skjeggstyling og trimming",
    category: "Skjegg",
    serviceType: "beard",
  },
  {
    id: 4,
    src: "/gallery/hair-color.jpg",
    alt: "Vibrant burgundy hårfarge",
    category: "Hårfarge",
    serviceType: "color",
  },
  {
    id: 5,
    src: "/gallery/updo-style.jpg",
    alt: "Elegant brudefrisyre med flettet krone",
    category: "Brudestyling",
    serviceType: "styling",
  },
];

const categories = ["Alle", "Herreklipp", "Hårfarge", "Skjegg", "Brudestyling"];

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Alle");

  const filteredImages =
    selectedCategory === "Alle"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Vårt Arbeid
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
            Se eksempler på våre tidligere arbeider. Vi er stolte av kvaliteten og
            kreativiteten i hver eneste styling vi leverer.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-medium text-blue-300 mb-1">
                    {image.category}
                  </p>
                  <p className="text-lg font-semibold mb-4">{image.alt}</p>
                  
                  {/* Booking CTA Button */}
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <Link to={`/book?service=${image.serviceType}`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Bestill denne tjenesten
                    </Link>
                  </Button>
                </div>
              </div>
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-slate-500">
              Ingen bilder funnet i denne kategorien.
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Klar for din transformasjon?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Book en time i dag og opplev den samme kvaliteten du ser i galleriet vårt.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-slate-50 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-6"
            >
              <Link to="/book">
                <Calendar className="mr-2 h-5 w-5" />
                Book time nå
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors duration-200 z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-5xl max-h-[90vh] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 rounded-b-lg">
              <p className="text-sm font-medium text-blue-300 mb-2">
                {selectedImage.category}
              </p>
              <p className="text-2xl font-semibold text-white mb-6">
                {selectedImage.alt}
              </p>
              
              {/* Booking CTA in Lightbox */}
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Link to={`/book?service=${selectedImage.serviceType}`}>
                  <Calendar className="mr-2 h-5 w-5" />
                  Bestill denne tjenesten
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
