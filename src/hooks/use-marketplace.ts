"use client";
import { useQuery } from "@tanstack/react-query";
import { api, type Category, type Item } from "@/lib/api";
export function useCategories(){return useQuery({queryKey:["categories"],queryFn:()=>api<Category[]>("/categories")})}
export function useItems(params:URLSearchParams){return useQuery({queryKey:["items",params.toString()],queryFn:()=>api<Item[]>(`/items?${params.toString()}`)})}
export function useItem(id:string){return useQuery({queryKey:["item",id],queryFn:()=>api<Item>(`/items/${id}`),enabled:Boolean(id)})}
