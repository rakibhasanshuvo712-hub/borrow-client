"use client";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { api, type Item } from "@/lib/api";
const PAGE_SIZE = 12;
export default function ExplorePage(){
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [area] = useState(params.get("area")?.trim() || "");
  const [sort, setSort] = useState("recommended");
  const [debounced, setDebounced] = useState(q.trim());
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(timer);
  }, [q]);
  const query = useMemo(() => {
    const search = new URLSearchParams({ limit: String(PAGE_SIZE), sort });
    if (debounced) search.set("q", debounced);
    if (category) search.set("category", category);
    return search.toString();
  }, [debounced, category, sort]);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["items", query],
    queryFn: ({ pageParam }) => api<Item[]>(`/items?${query}&page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
  });
  const items = (data?.pages.flat() ?? []).filter(item => !area || `${item.location?.area || ""} ${item.location?.city || ""}`.toLowerCase().includes(area.toLowerCase()));
  return <><main className="container" style={{paddingTop:46,paddingBottom:70}}><div className="eyebrow">THE BORROWHUB MARKETPLACE</div><h1 style={{fontSize:42,margin:"8px 0"}}>Find your next rental</h1><p style={{color:"#64748b",marginTop:0}}>{area ? <>Discover useful things near <b>{area}</b>.</> : "Discover useful things from people nearby."}</p><div className="explore-controls"><label className="field"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search cameras, tools, gear..."/></label><label className="field"><SlidersHorizontal size={16}/><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{["electronics","tools","outdoors","photography","party","sports"].map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select></label><select className="sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recommended</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option></select></div>{isLoading?<div className="grid">{Array.from({length:6},(_,i)=><div key={i} className="card" style={{height:320,background:"#f5f6fa"}}/>)}</div>:isError?<p role="alert">Couldn’t load items. Check that the BorrowHub API is running, then refresh.</p>:items.length?<div className="grid">{items.map(item=><ItemCard key={item._id} item={item}/>)}</div>:<div className="empty">No items match those filters. Try another search.</div>}{hasNextPage&&!isError&&<div style={{textAlign:"center",marginTop:32}}><button className="btn" onClick={()=>fetchNextPage()} disabled={isFetchingNextPage} style={{border:"1px solid #e3e6ef",background:"white"}}>{isFetchingNextPage?"Loading…":"Load more"}</button></div>}</main><style jsx>{`.explore-controls{display:grid;grid-template-columns:1fr 220px 200px;gap:12px;margin:30px 0}.field{height:50px;border:1px solid #e5e7ef;border-radius:14px;padding:0 14px;display:flex;align-items:center;gap:10px;color:#64748b}.field input,.field select{border:0;outline:0;width:100%;background:transparent}.sort{border:1px solid #e5e7ef;border-radius:14px;padding:0 13px;background:white}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr));gap:20px}.empty{padding:60px;text-align:center;background:#f8fafc;border-radius:20px;color:#64748b}@media(max-width:650px){.explore-controls{grid-template-columns:1fr}.sort{height:50px}}`}</style></>}
