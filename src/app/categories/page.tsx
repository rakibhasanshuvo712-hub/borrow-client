"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, type Category } from "@/lib/api";
export default function CategoriesPage(){const{data,isLoading,error}=useQuery({queryKey:["categories"],queryFn:()=>api<Category[]>("/categories")});return <><main className="container" style={{padding:"55px 0 80px"}}><div className="eyebrow">Explore the possibilities</div><h1 style={{fontSize:42}}>All categories</h1><p style={{color:"#64748b"}}>Find what you need for the day, the weekend, or your next big idea.</p>{isLoading?<p>Loading categories…</p>:error?<p role="alert">Could not load categories. Check your API connection.</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginTop:28}}>{data?.map(c=><Link className="card" style={{padding:24,fontWeight:700}} key={c.slug} href={`/explore?category=${c.slug}`}>{c.name}<span style={{float:"right",color:"#7565e9"}}>↗</span></Link>)}</div>}</main></>}
