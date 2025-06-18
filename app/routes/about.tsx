import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">About Bruno</h1>
          <Link to="/">
            <Button
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Back to Chat
            </Button>
          </Link>
        </div>

        <div className="prose prose-invert max-w-none">
          <h2 className="text-xl font-semibold mt-6 mb-4">Project Goal</h2>
          <p>
            Bruno is an open-source chat interface designed to provide a clean,
            intuitive way to interact with various AI models. The project aims
            to create a platform that is both powerful for advanced users and
            accessible for newcomers to AI.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">
            Why I Created This
          </h2>
          <p>
            I built this project to explore the capabilities of modern AI models
            while creating a tool that's genuinely useful for everyday tasks. By
            making it open source, I hope to contribute to the community and
            encourage collaborative improvement of AI interfaces.

            It's still a work in progress, and I welcome feedback and contributions
            from anyone interested in enhancing the functionality and user
            experience of Bruno.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">
            In Memory of Rickard Bruno Eriksson
          </h2>
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 my-6">
            <p className="italic">
              The name "Bruno" is a homage to my late friend, Rickard Bruno
              Eriksson. His creativity, intelligence, and kind spirit continue
              to inspire this project and many other aspects of my life. This
              application stands as a small tribute to his memory and the
              positive impact he had on those around him.
            </p>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-4">Technology</h2>
          <p>
            This application is built with React, TypeScript, React Router and
            Prisma as the ORM. It leverages modern AI models through various
            provider APIs to deliver a responsive and intelligent chat
            experience.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">Get Involved</h2>
          <p>
            Bruno is an open-source project, and contributions are welcome!
            Whether you're a developer interested in adding features, a designer
            with ideas for improving the UI, or just someone who found a bug,
            your input is valuable.
          </p>

          <div className="flex gap-4 mt-8">
            <a
              href="https://github.com/FredrikHillbert/Bruno"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 flex items-center gap-2"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Contribute on GitHub
            </a>

            <a
              href="https://x.com/CodeBuddyBenny"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Follow on X
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
