import { Suspense } from "react";
import Layout from "@/components/Layout";
import Chats from "@/views/Chats";

export default function ChatsPage() {
  return <Layout><Suspense><Chats /></Suspense></Layout>;
}
