export const shop = {
  name: "Espaço das Flores",
  whatsapp: "554792036899",
  phone: "(47) 3325-1889",
  address: "Rua Frei Estanislau Schaette, 621, Água Verde, Blumenau–SC",
  hours: "Seg.–sex. 08:00–18:00 · Sáb. 08:30–12:30",
  instagram: "https://www.instagram.com/espacodasflores_/",
  hero: "/media/hero.webp",
  video: "/media/hero.mp4",
};
export const whatsapp = (message: string) =>
  `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;
export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  stock: number;
  featured: boolean;
  active: boolean;
  variation: string;
  photo: string;
  photos: string[];
  version?: number;
};
export const categories = [
  "Ramalhetes",
  "Buquês",
  "Arranjos",
  "Cestas",
  "Presentes",
  "Plantas",
  "Ocasiões especiais",
  "Decoração",
  "Coroas",
];
export const initialProducts: Product[] = [
  {
    id: "ramalhete-tres-rosas",
    name: "Um gesto de carinho",
    category: "Ramalhetes",
    description:
      "Ramalhete com 3 rosas nacionais e folhagens, preparado com todo o cuidado.",
    price: 110,
    stock: 10,
    featured: true,
    active: true,
    variation: "Rosé,Vermelho,Branco",
    photo: "",
    photos: [],
  },
  {
    id: "buque-jardim",
    name: "Poesia em flores",
    category: "Buquês",
    description:
      "Flores da estação em uma composição delicada e cheia de vida.",
    price: null,
    stock: 8,
    featured: true,
    active: true,
    variation: "Rosé,Colorido",
    photo: "",
    photos: [],
  },
  {
    id: "arranjo-afeto",
    name: "Afeto que floresce",
    category: "Arranjos",
    description: "Um pequeno jardim para iluminar os dias e os espaços.",
    price: null,
    stock: 5,
    featured: true,
    active: true,
    variation: "Natural",
    photo: "",
    photos: [],
  },
  {
    id: "cesta-amanhecer",
    name: "Um lindo amanhecer",
    category: "Cestas",
    description:
      "Surpreenda com flores e delicadezas escolhidas para presentear.",
    price: null,
    stock: 4,
    featured: true,
    active: true,
    variation: "Tradicional",
    photo: "",
    photos: [],
  },
];
export const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mídias reais recebidas em vídeo. As capas e imagens são frames dos originais.
export const galleryMedia = [
  {
    id: "hortensias-video",
    title: "Hortênsias, delicadeza em cada pétala",
    alt: "Buquês reais de hortênsias lilases e rosadas com eucalipto e embalagem verde-clara",
    poster: "/media/buques-hortensias-capa.webp",
    video: "/media/buques-hortensias.mp4",
    height: 960,
  },
  {
    id: "natal-video",
    title: "O encanto do Natal ganha forma",
    alt: "Montagem de uma decoração natalina com miniaturas de árvores, casinhas e folhagens",
    poster: "/media/decoracao-natalina-capa.webp",
    video: "/media/decoracao-natalina.mp4",
    height: 1280,
  },
  {
    id: "hortensias-detalhe",
    title: "Pequenos detalhes, muito afeto",
    alt: "Detalhe dos buquês de hortênsias e folhagens, extraído do vídeo da loja",
    poster: "/media/buques-hortensias-detalhe.webp",
    video: null,
    height: 960,
  },
  {
    id: "natal-detalhe",
    title: "Uma estação para encantar",
    alt: "Detalhe da composição natalina artesanal, extraído do vídeo da loja",
    poster: "/media/decoracao-natalina-detalhe.webp",
    video: null,
    height: 1280,
  },
];

// Transcrição apenas dos trechos legíveis na captura enviada; sem consulta em tempo real.
export const googleReviews = {
  rating: "4,8",
  count: 189,
  source: "Dados da captura enviada · sem atualização automática",
  items: [
    {
      id: "mayara",
      name: "Mayara C. W. P. Poffo",
      initials: "M",
      text: "Simplesmente amo essa loja! 🌷✨",
      note: "Trecho visível da avaliação",
      stars: 5,
    },
    {
      id: "simone",
      name: "Simone Schneider",
      initials: "S",
      text: "Loja com decorações maravilhosas para todas as épocas do ano! Atendimento excelente, tudo de muito bom gosto! Indico de olhos fechados!!",
      note: "Avaliação transcrita da captura",
      stars: 5,
    },
  ],
};
