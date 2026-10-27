import type {MetadataRoute} from 'next';

/**
 * Public, crawlable evergreen routes only.
 * Never index private orders, checkout, authentication, admin, internal APIs,
 * placeholder product URLs or unverified individual restaurant/seller pages.
 * Availability on discovery pages is explicitly conditional on real partners.
 */
export default function sitemap():MetadataRoute.Sitemap {
  const origin='https://zeshu.in';
  const pages=[
    {path:'/',priority:1,changeFrequency:'daily'},
    {path:'/help',priority:.9,changeFrequency:'monthly'},
    {path:'/policies',priority:.8,changeFrequency:'monthly'},
    {path:'/partners',priority:.75,changeFrequency:'monthly'},
    {path:'/fashion',priority:.7,changeFrequency:'weekly'},
    {path:'/dine',priority:.7,changeFrequency:'weekly'},
    {path:'/move',priority:.65,changeFrequency:'weekly'},
    {path:'/professional-services',priority:.65,changeFrequency:'weekly'},
    {path:'/professional-services/weddings',priority:.6,changeFrequency:'monthly'},
    {path:'/professional-services/interiors',priority:.6,changeFrequency:'monthly'},
    {path:'/earn',priority:.65,changeFrequency:'monthly'},
    {path:'/earn/promoters',priority:.55,changeFrequency:'monthly'},
    {path:'/app',priority:.55,changeFrequency:'monthly'},
    {path:'/green',priority:.5,changeFrequency:'monthly'},
  ] as const;
  return pages.map(p=>({
    url:origin+p.path,
    priority:p.priority,
    changeFrequency:p.changeFrequency,
  }));
}
