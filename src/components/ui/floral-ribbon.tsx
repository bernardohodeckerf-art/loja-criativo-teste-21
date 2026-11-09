import { Flower2 } from "lucide-react";
export default function FloralRibbon() {
  return (
    <div
      className="floral-ribbon"
      aria-label="Flores, buquês e presentes feitos com afeto"
    >
      <div aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i}>
            FLORES QUE ENCANTAM <Flower2 /> BUQUÊS COM AFETO <Flower2 />{" "}
            PRESENTES PARA LEMBRAR <Flower2 />
          </span>
        ))}
      </div>
    </div>
  );
}
