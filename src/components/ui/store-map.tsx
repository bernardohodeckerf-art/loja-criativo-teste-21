import { MapPin, Navigation } from "lucide-react";
import { mapsEmbedUrl, mapsDirectionsUrl, shop } from "@/data";
export default function StoreMap() {
  return (
    <section className="store-map section" aria-labelledby="map-heading">
      <div>
        <span className="eyebrow">NOSSO ENDEREÇO EM BLUMENAU</span>
        <h2 id="map-heading">
          Venha sentir de perto.
          <br />
          <em>A gente espera você.</em>
        </h2>
        <p>
          <MapPin size={17} />
          {shop.address}
        </p>
        <a
          className="button green"
          href={mapsDirectionsUrl}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation size={16} />
          Traçar rota no Google Maps
        </a>
      </div>
      <div className="map-frame">
        <iframe
          title="Localização da Floricultura Espaço das Flores em Blumenau"
          src={mapsEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <a href={mapsDirectionsUrl} target="_blank" rel="noreferrer">
          Abrir no Google Maps ↗
        </a>
      </div>
    </section>
  );
}
