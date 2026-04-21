import { NextResponse } from 'next/server';

// 🚀 ZESHU SMART WATERFALL ENGINE
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat') || '18.7989'; // Default Jagtial Lat
  const lng = searchParams.get('lng') || '78.9117'; // Default Jagtial Lng

  if (!query) {
    return NextResponse.json({ success: false, message: "Search query required" }, { status: 400 });
  }

  try {
    // 1️⃣ PING MEDPAY FOR LOCAL INVENTORY
    // Note: Replace with actual MedPay production endpoint and auth headers
    const medpayRes = await fetch(`https://api.medpay.in/v1/network/search?keyword=${query}&lat=${lat}&lng=${lng}&radius=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MEDPAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const localData = await medpayRes.json();

    // 2️⃣ THE SPLIT DECISION
    if (localData.status === 'success' && localData.inventory && localData.inventory.length > 0) {
      
      // 🎉 LOCAL STOCK FOUND! Route to Zeshu Native Cart
      const bestPharmacy = localData.inventory[0]; // Grab the closest pharmacy with stock
      
      return NextResponse.json({
        success: true,
        routing_type: 'local',
        fulfillment: {
          provider: 'Zeshu Quick',
          eta: '30-45 mins',
          badgeColor: '#10B981', // Emerald Green
        },
        products: localData.inventory.map((item: any) => ({
          id: item.sku_id,
          name: item.name,
          price: item.mrp,
          discount_price: item.selling_price,
          requires_rx: item.requires_prescription,
          pharmacy_id: bestPharmacy.pharmacy_id
        }))
      });

    } else {
      
      // ⚠️ LOCAL STOCK FAILED. Trigger Affiliate Fallback
      // Encode the query to inject into the Apollo search URL
      const apolloDeepLink = `https://www.apollo247.com/search?q=${encodeURIComponent(query)}&utm_source=zeshu_app&utm_campaign=fallback`;
      
      return NextResponse.json({
        success: true,
        routing_type: 'affiliate',
        fulfillment: {
          provider: 'Apollo 24|7',
          eta: '1-2 Days',
          badgeColor: '#F59E0B', // Warning Amber
        },
        fallback_action: {
          message: 'Currently out of stock locally. Redirecting to our national partner.',
          link: apolloDeepLink
        },
        products: [] // Empty because Apollo handles the UI
      });
    }

  } catch (error: any) {
    console.error("MedPay Loop Crashed:", error);
    return NextResponse.json({ success: false, message: "Medicine network offline" }, { status: 500 });
  }
}