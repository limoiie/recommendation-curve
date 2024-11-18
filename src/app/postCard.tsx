import { CalendarHeart, CalendarPlus, Heart, MessageCircle } from "lucide-react";

export default function PostCard({data}: { data: Post }) {
  return (
    <div className="w-96 p-4 flex flex-col gap-1 rounded border">
      <div className="flex flex-row gap-4 items-center font-mono text-sm">
        <div className="flex flex-row items-center gap-1">
          <Heart size={16}/>
          <p className="w-4">{data.likes}</p>
        </div>
        <div className="flex flex-row items-center gap-1">
          <MessageCircle size={16}/>
          <p className="w-4">{data.comments}</p>
        </div>
        <div className="flex flex-row items-center gap-1">
          <CalendarPlus size={16}/>
          <p className="w-4">{data.daysPastCreation}</p>
        </div>
        <div className="flex flex-row items-center gap-1">
          <CalendarHeart size={16}/>
          <p className="w-4">{data.daysPastLastRecommendation}</p>
        </div>
      </div>
    </div>
  )
}
