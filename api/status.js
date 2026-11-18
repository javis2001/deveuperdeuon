export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const id = String(req.query.id || '');
 if(!/^[a-zA-Z0-9_-]{5,120}$/.test(id))return res.status(400).json({error:'ID inválido'});
 const url = process.env.DUTTYFY_PIX_URL_ENCRYPTED;
 if(!url)return res.status(503).json({error:'Gateway não configurado'});
 if(!/^https:\/\/[^\s/]+\/api-pix\/[^\s?#]+$/.test(url))return res.status(503).json({error:'URL da Duttyfy inválida'});
 try{
  const endpoint = new URL(url);
  endpoint.searchParams.set('transactionId',id);
  const response = await fetch(endpoint.toString(),{signal:AbortSignal.timeout(10000)});
  const data = await response.json().catch(()=>({}));
  if(!response.ok)return res.status(502).json({error:'Falha ao consultar pagamento'});
  const upstreamStatus = String(data.status || '').toUpperCase();
  const status = ({PENDING:'WAITING_PAYMENT',COMPLETED:'PAID',CANCELLED:'CANCELLED',REFUNDED:'REFUNDED',FAILED:'REFUSED'})[upstreamStatus];
  if(!status)return res.status(502).json({error:'Status não reconhecido'});
  return res.status(200).json({id,status});
 }catch(err){console.error('status:',err?.name);return res.status(502).json({error:'Falha temporária na consulta'});}
}
