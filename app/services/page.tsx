import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Recharge, Bills & Digital Services | Zeshu',
  description: 'Open Zeshu recharge, electricity, DTH, FASTag, gas, broadband and other India-wide digital service tools.',
};

export default function ServicesPage() {
  redirect('/?view=services');
}
