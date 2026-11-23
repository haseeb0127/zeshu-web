import type {Metadata} from "next";
import type {ReactNode} from "react";

export const metadata:Metadata={
  title:"Zeshu Move | Cabs, Trucks & Scheduled Transport Quotes",
  description:"Explore auto and cab options where partners are approved, or request a free Jagtial district cab, truck or marriage bus operator quote. No instant booking or fare guarantee.",
  alternates:{canonical:"/move"},
};

export default function MoveLayout({children}:{children:ReactNode}){
  return children;
}
