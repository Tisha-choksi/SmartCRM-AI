'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STAGES = ['lead','qualified','proposal','negotiation','won']

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  useEffect(()=>{
    supabase.from('deals').select('*').then(({data})=>setDeals(data||[]))
  },[])
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:500,marginBottom:24}}>Deal pipeline</h1>
      <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:16}}>
        {STAGES.map(stage=>(
          <div key={stage} style={{minWidth:200,flex:'0 0 200px'}}>
            <div style={{fontSize:12,fontWeight:500,textTransform:'capitalize',color:'#888',marginBottom:10}}>
              {stage} ({deals.filter(d=>d.stage===stage).length})
            </div>
            {deals.filter(d=>d.stage===stage).map(deal=>(
              <div key={deal.id} style={{border:'0.5px solid #e5e5e0',borderRadius:8,padding:12,marginBottom:8}}>
                <p style={{fontWeight:500,fontSize:14,margin:'0 0 4px'}}>{deal.title}</p>
                <p style={{fontSize:12,color:'#888',margin:0}}>${Number(deal.value).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}