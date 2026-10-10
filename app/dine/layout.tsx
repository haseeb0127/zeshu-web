import type {Metadata} from 'next';
import type {ReactNode} from 'react';
export const metadata:Metadata={
 title:'Zeshu Dine | Table Reservations & Pre-order Meals in Jagtial',
 description:'Request a restaurant table and optionally pre-order meals. Real table availability and kitchen serving time are only confirmed by verified restaurant partners.',
 robots:{index:true,follow:true},
};
export default function DineLayout({children}:{children:ReactNode}){return children;}
