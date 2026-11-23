/**
 * One Zeshu application, independently themed department homepages.
 * Navigation only targets existing pages and real page sections; it does
 * not create a new authentication, cart, payment or wallet namespace.
 */
export type DepartmentId = 'dine' | 'fashion' | 'pay' | 'move' | 'services' | 'weddings' | 'interiors';
export type DepartmentNavItem = { label: string; href: string };
export type DepartmentConfig = {
  id: DepartmentId;
  title: string;
  href: string;
  accent: string;
  soft: string;
  searchPlaceholder: string;
  searchEnabled: boolean;
  actionLabel: string;
  actionHref: string;
  tabs: readonly DepartmentNavItem[];
};

export const DEPARTMENTS: Record<DepartmentId, DepartmentConfig> = {
  dine: {
    id:'dine', title:'Zeshu Dine', href:'/dine', accent:'#be4b16', soft:'#fff1e8',
    searchPlaceholder:'Search restaurants, biryani, tiffins…', searchEnabled:true,
    actionLabel:'Find a table', actionHref:'/dine#restaurants',
    tabs:[{label:'Hub',href:'/'},{label:'Dine',href:'/dine'},{label:'Restaurants',href:'/dine#restaurants'},{label:'My requests',href:'/dine#my-dining-requests'}],
  },
  fashion: {
    id:'fashion',title:'Zeshu Fashion',href:'/fashion',accent:'#742c63',soft:'#fbf0f8',
    searchPlaceholder:'Search kurtis, sarees, shirts, shoes…',searchEnabled:true,
    actionLabel:'Browse fashion',actionHref:'/fashion#live-fashion-title',
    tabs:[{label:'Hub',href:'/'},{label:'Fashion',href:'/fashion'},{label:'Categories',href:'/fashion#fashion-categories-title'},{label:'Catalogue',href:'/fashion#live-fashion-title'}],
  },
  pay: {
    id:'pay',title:'Zeshu Pay',href:'/pay',accent:'#09658a',soft:'#eff9fe',
    searchPlaceholder:'Search mobile, electricity, DTH, FASTag…',searchEnabled:true,
    actionLabel:'Browse bills',actionHref:'/pay#pay-service-heading',
    tabs:[{label:'Hub',href:'/'},{label:'Pay',href:'/pay'},{label:'Utilities',href:'/pay#pay-service-heading'},{label:'Help',href:'/help'}],
  },
  move: {
    id:'move',title:'Zeshu Move',href:'/move',accent:'#242a35',soft:'#fff3d3',
    searchPlaceholder:'Where to? Plan a cab, truck or bus',searchEnabled:false,
    actionLabel:'Plan a journey',actionHref:'/move/quote',
    tabs:[{label:'Hub',href:'/'},{label:'Move',href:'/move'},{label:'Scheduled quotes',href:'/move#move-district'},{label:'Get quote',href:'/move/quote'}],
  },
  services: {
    id:'services',title:'Zeshu Services',href:'/services',accent:'#087e72',soft:'#eafaf5',
    searchPlaceholder:'Search AC repair, plumber, beautician, mehndi…',searchEnabled:true,
    actionLabel:'Get a quote',actionHref:'/services#home-quote',
    tabs:[{label:'Hub',href:'/'},{label:'Services',href:'/services'},{label:'Service menu',href:'/services#service-menus'},{label:'Free quote',href:'/services#home-quote'}],
  },
  weddings: {
    id:'weddings',title:'Zeshu Weddings',href:'/weddings',accent:'#9a6240',soft:'#fff5e9',
    searchPlaceholder:'Wedding planners, venues, decor…',searchEnabled:false,
    actionLabel:'Request wedding quote',actionHref:'/weddings#wedding-quote',
    tabs:[{label:'Hub',href:'/'},{label:'Weddings',href:'/weddings'},{label:'Services',href:'/weddings#wedding-services'},{label:'Free quote',href:'/weddings#wedding-quote'}],
  },
  interiors: {
    id:'interiors',title:'Zeshu Interiors',href:'/interiors',accent:'#7b674c',soft:'#faf5eb',
    searchPlaceholder:'Kitchens, wardrobes, decorators…',searchEnabled:false,
    actionLabel:'Request project quote',actionHref:'/interiors#interior-quote',
    tabs:[{label:'Hub',href:'/'},{label:'Interiors',href:'/interiors'},{label:'Projects',href:'/interiors#interior-categories'},{label:'Free quote',href:'/interiors#interior-quote'}],
  },
} as const;

export const DEPARTMENT_ORDER: readonly DepartmentId[] = ['dine','fashion','pay','move','services','weddings','interiors'];

export function departmentForPathname(pathname: string): DepartmentConfig | null {
  if (pathname === '/professional-services/home-services') return DEPARTMENTS.services;
  if (pathname === '/professional-services/weddings') return DEPARTMENTS.weddings;
  if (pathname === '/professional-services/interiors') return DEPARTMENTS.interiors;
  const match = DEPARTMENT_ORDER.find(id => {
    const prefix = DEPARTMENTS[id].href;
    return pathname === prefix || pathname.startsWith(prefix + '/');
  });
  return match ? DEPARTMENTS[match] : null;
}

export function departmentSearchHref(id: DepartmentId, query: string): string {
  const q = query.trim().slice(0,120);
  const department = DEPARTMENTS[id];
  if (!q || !department.searchEnabled) return department.actionHref;
  return department.href + '?q=' + encodeURIComponent(q) +
    (id === 'fashion' ? '#live-fashion-title' : id === 'dine' ? '#restaurants' :
     id === 'pay' ? '#pay-service-heading' : '#service-menus');
}
