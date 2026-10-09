import { ReviewScreen } from "@/components/capture/review-screen";

export default async function ReviewPage({ searchParams }: PageProps<"/capture/review">) {
  const { capture } = await searchParams;
  return <ReviewScreen captureId={typeof capture === "string" ? capture : null} />;
}
