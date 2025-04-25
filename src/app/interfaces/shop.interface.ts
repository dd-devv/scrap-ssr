export interface Shop {
  id: number;
  name: string;
  logo: any;
  url: string;
}

export const Shops: Shop[] = [
  {
    id: 1,
    name: 'Falabella',
    logo: 'assets/svg/falabella.svg',
    url: 'https://www.falabella.com.pe/falabella-pe',
  },
  {
    id: 2,
    name: 'Mercado Libre',
    logo: 'assets/svg/mercadolibre.svg',
    url: 'https://www.mercadolibre.com.pe/',
  },
  {
    id: 3,
    name: 'Oechsle',
    logo: 'assets/svg/oechsle.svg',
    url: 'https://www.oechsle.pe/',
  },
  {
    id: 4,
    name: 'Platanitos',
    logo: 'assets/svg/platanitos.svg',
    url: 'https://platanitos.com/pe',
  },
  {
    id: 5,
    name: 'PlazaVea',
    logo: 'assets/svg/plazavea.svg',
    url: 'https://www.plazavea.com.pe/',
  },
  {
    id: 6,
    name: 'Ripley',
    logo: 'assets/svg/ripley.svg',
    url: 'https://simple.ripley.com.pe/',
  },
];
