import QRCode from 'qrcode';

const catalog = {bronze:{1:4970,2:6461,3:8201},prata:{1:7990,2:10387,3:13184},ouro:{1:9990,2:12987,3:16484}};
const freight = {gratis:0,jadlog:990,retirada:0,full:1990};
const upgrades = {nenhum:0,premium:1990,dobro:2590,iphone:7900};
const titles = {bronze:'Bronze',prata:'Prata',ouro:'Ouro'};
const extras = {premium:'Upgrade Premium',dobro:'Caixa em Dobro',iphone:'Um iPhone Garantido'};
const digits = v => String(v || '').replace(/\D/g,'');
const validCpf = input => {
 const cpf = digits(input);
 if(!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
 for(let n=9;n<=10;n++) {let sum=0;for(let i=0;i<n;i++)sum+=Number(cpf[i])*(n+1-i);let check=sum*10%11;if(check===10)check=0;if(check!==Number(cpf[n]))return false;}
 return true;
};
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 if(!process.env.DUTTYFY_PIX_URL_ENCRYPTED)return res.status(503).json({error:'URL da Duttyfy não configurada no servidor'});
 try {
  const body = typeof req.body==='string'?JSON.parse(req.body):req.body || {};
  const {plan,qty,shipping,upgrade,customer,address} = body;
  const attribution = Object.fromEntries(Object.entries(body.attribution || {}).filter(([k,v]) => ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','fbclid','src','sck'].includes(k) && typeof v === 'string').map(([k,v])=>[k,v.slice(0,300)]));
  if(!Object.hasOwn(catalog,plan)||![1,2,3].includes(qty)||!Object.hasOwn(freight,shipping)||!Object.hasOwn(upgrades,upgrade))return res.status(400).json({error:'Opções do pedido inválidas'});
  if(!customer || typeof customer.name!=='string'||customer.name.trim().length<3||typeof customer.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)||!validCpf(customer.cpf)||digits(customer.phone).length<10||digits(customer.phone).length>13)return res.status(400).json({error:'Dados pessoais inválidos'});
  if(!address || digits(address.cep).length!==8 || !String(address.street||'').trim() || !String(address.number||'').trim() || !String(address.city||'').trim() || !String(address.state||'').trim())return res.status(400).json({error:'Endereço inválido'});
  const base = catalog[plan][qty], delivery = freight[shipping], extra = upgrades[upgrade];
  const amount = base+delivery+extra;
  const orderId = 'DP-'+crypto.randomUUID();
  const url = process.env.DUTTYFY_PIX_URL_ENCRYPTED;
  if(!/^https:\/\/[^\s/]+\/api-pix\/[^\s?#]+$/.test(url))return res.status(503).json({error:'URL da Duttyfy inválida'});
  const payload = {
    amount,
    customer:{name:customer.name.trim(),document:digits(customer.cpf),email:customer.email.trim(),phone:digits(customer.phone).slice(-11)},
    item:{title:`${qty}x Caixa Surpresa ${titles[plan]}${delivery ? ' + Frete '+shipping : ''}${extra ? ' + '+extras[upgrade] : ''}`,price:amount,quantity:1},
    paymentMethod:'PIX',
    utm:new URLSearchParams(attribution).toString()
  };
  const upstream = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  const data = await upstream.json().catch(()=>({}));
  if(!upstream.ok || !data.transactionId || !data.pixCode)return res.status(502).json({error:'Gateway não gerou o Pix. Verifique logs do servidor.',gatewayStatus:upstream.status});
  const qrcodeImage = await QRCode.toDataURL(data.pixCode,{width:300,margin:2});
  return res.status(201).json({success:true,id:data.transactionId,status:data.status || 'PENDING',amount,orderId,pix:{qrcode:data.pixCode,qrcodeImage}});
 } catch(err) {console.error('create-pix:',err?.message);return res.status(500).json({error:'Não foi possível criar a cobrança. Tente novamente.'});}
}
