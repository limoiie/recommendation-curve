import { CalendarHeart, CalendarPlus, Heart, MessageCircle } from "lucide-react";

export default function PostCard({data, className}: { data: Post, className?: string }) {
  const timeSinceCreated = data.hoursSinceCreation < 24 ? `${Math.floor(data.hoursSinceCreation)}H` : `${Math.floor(data.hoursSinceCreation / 24)}D`;
  const timeSinceLastRecommendation = data.daysSinceLastRecommendation < 0 ? `-` : `${data.daysSinceLastRecommendation}d`;

  return (
    <div className={"p-4 flex flex-col gap-1 rounded border " + className}>
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
          <p className="w-8 text-right">{
            data.hoursSinceCreation < 24 ?
              <span className="font-bold text-green-500">{timeSinceCreated}</span> :
              <span>{timeSinceCreated}</span>
          }</p>
        </div>
        <div className="flex flex-row items-center gap-1">
          <CalendarHeart size={16}/>
          <p className="w-4">{timeSinceLastRecommendation}</p>
        </div>
      </div>
    </div>
  )
}
