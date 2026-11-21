import type {Metadata} from "next";

export const metadata:Metadata={
  title:"Zeshu Pay | Recharge Plans & Bill Service Discovery",
  description:"Explore mobile recharge plans, electricity, DTH, FASTag and bill service information on Zeshu. Live payments and recharges are not enabled yet.",
  alternates:{canonical:"/pay"},
  openGraph:{
    title:"Zeshu Pay — Digital Services",
    description:"Discover recharge plans and bill services in India. Real payments are not enabled yet.",
    url:"https://zeshu.in/pay",
  },
};

export default function PayLayout({children}:{children:React.ReactNode}){
  return children;
}
