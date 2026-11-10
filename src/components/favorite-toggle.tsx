"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { api, type Item } from "@/lib/api";

type Favorite = { item: Item };
export function FavoriteToggle({ item }: { item: Item }) {
  const itemId = item._id;
  const client = useQueryClient();
  const { data } = useQuery({ queryKey: ["favorites"], queryFn: () => api<Favorite[]>("/favorites"), retry: false });
  const active = data?.some((favorite) => favorite.item._id === itemId) ?? false;
  const toggle = useMutation({
    mutationFn: () => api<{ favorited: boolean }>(`/favorites/${itemId}`, { method: "POST" }),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: ["favorites"] });
      const previous = client.getQueryData<Favorite[]>(["favorites"]);
      if (previous) {
        const next = active ? previous.filter((favorite) => favorite.item._id !== itemId) : [...previous, { item }];
        client.setQueryData(["favorites"], next);
      }
      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) client.setQueryData(["favorites"], context.previous);
      toast.error(error.message);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ["favorites"] }),
    onSuccess: (result) => toast.success(result.favorited ? "Saved to favorites" : "Removed from favorites"),
  });
  return <button type="button" className="favorite-button" style={{width:44,height:44,borderRadius:14,border:"1px solid #e5e7ef",background:"white",color:active?"#e11d48":"#64748b",display:"grid",placeItems:"center",cursor:"pointer"}} aria-label={active ? "Remove from favorites" : "Add to favorites"} aria-pressed={active} disabled={toggle.isPending} onClick={() => toggle.mutate()}><Heart size={19} fill={active ? "currentColor" : "none"}/></button>;
}
