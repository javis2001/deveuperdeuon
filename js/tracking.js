/* Meta Pixel + preservação de atribuição. Token CAPI nunca fica no navegador. */
(function(){
 'use strict';
 const PIXEL_ID='3540274636135879';
 const KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','fbclid','src','sck'];
 const storeKey='dp_attribution_v1';
 const query=new URLSearchParams(location.search);
 let saved={};try{saved=JSON.parse(localStorage.getItem(storeKey)||'{}')||{}}catch(_){}
 for(const key of KEYS){if(query.has(key))saved[key]=query.get(key).slice(0,300)}
 try{localStorage.setItem(storeKey,JSON.stringify(saved))}catch(_){}
 window.DPTracking={
  attribution:()=>({...saved}),
  event:(name,params={},eventID)=>{if(typeof window.fbq==='function')window.fbq('track',name,params,eventID?{eventID}:undefined)},
  custom:(name,params={})=>{if(typeof window.fbq==='function')window.fbq('trackCustom',name,params)},
  purchase:(id,amount)=>{
   if(!id||!Number.isFinite(Number(amount)))return;
   const key='dp_purchase_'+id;
   try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1')}catch(_){}
   window.DPTracking.event('Purchase',{value:Number(amount)/100,currency:'BRL'},'dp_purchase_'+id);
  }
 };
 !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
 if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
 t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
 }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
 fbq('init',PIXEL_ID);fbq('track','PageView');
 const checkout=location.pathname.includes('checkout');
 if(checkout){window.DPTracking.event('InitiateCheckout',{currency:'BRL'})}
 else{
  window.DPTracking.event('ViewContent',{content_type:'product_group',content_name:'Caixas Surpresa Deveu Perdeu'});
  document.addEventListener('click',function(e){
   const link=e.target.closest('a[href]');if(!link)return;
   const url=new URL(link.href,location.href);
   if(url.origin!==location.origin||!url.pathname.startsWith('/checkout'))return;
   for(const [key,value] of Object.entries(saved))if(!url.searchParams.has(key))url.searchParams.set(key,value);
   link.href=url.pathname+url.search+url.hash;
   const plan=url.searchParams.get('plano')||'indefinido';
   window.DPTracking.event('AddToCart',{content_name:'Caixa '+plan,content_type:'product',currency:'BRL'});
  },true);
 }
})();
