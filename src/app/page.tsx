import Link from "next/link";

const routes = [
  { section: "Main", links: [{ href: "/(main)", label: "Dashboard / Home" }] },
  {
    section: "Courses",
    links: [
      { href: "/courses", label: "Courses List" },
      { href: "/courses/1", label: "Course Detail (id=1)" },
      { href: "/courses/1/lesson/1", label: "Lesson (course=1, lesson=1)" },
    ],
  },
  {
    section: "Community",
    links: [
      { href: "/community", label: "Community Feed" },
      { href: "/groups", label: "Groups List" },
      { href: "/groups/1", label: "Group Detail (id=1)" },
    ],
  },
  {
    section: "Events",
    links: [
      { href: "/events", label: "Events List" },
      { href: "/events/1", label: "Event Detail (id=1)" },
    ],
  },
  {
    section: "Recordings",
    links: [
      { href: "/recordings", label: "Recordings List" },
      { href: "/recordings/1", label: "Recording Detail (id=1)" },
    ],
  },
  {
    section: "Tutorials",
    links: [
      { href: "/tutorials", label: "Tutorials List" },
      { href: "/tutorials/video/1", label: "Video Tutorial (id=1)" },
      { href: "/tutorials/guide/1", label: "Guide Tutorial (id=1)" },
    ],
  },
  {
    section: "AI Agents",
    links: [
      { href: "/ai-agents", label: "AI Agents List" },
      { href: "/ai-agents/1", label: "Agent Detail (id=1)" },
    ],
  },
  {
    section: "User",
    links: [
      { href: "/profile", label: "Profile" },
      { href: "/settings", label: "Settings" },
      { href: "/subscription", label: "Subscription" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/onboarding", label: "Onboarding" },
    ],
  },
  {
    section: "Other",
    links: [
      { href: "/chats", label: "Chats" },
      { href: "/invite", label: "Invite" },
      { href: "/contact", label: "Contact" },
      { href: "/admin", label: "Admin" },
    ],
  },
];

export default function DevNav() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-10 font-mono">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Brainers Club — Dev Nav</h1>
          <p className="text-zinc-400 text-sm">
            Root <code className="text-zinc-300">/</code> is not a real app page. Pick a route below.
          </p>
        </div>

        <div className="space-y-6">
          {routes.map(({ section, links }) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                {section}
              </p>
              <div className="flex flex-col gap-1">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between rounded px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors group"
                  >
                    <span>{label}</span>
                    <span className="text-zinc-600 group-hover:text-zinc-400 text-xs">{href}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
