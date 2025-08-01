import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Linkedin, Twitter } from "lucide-react"

const teamMembers = [
  {
    name: "Dr. Sarah Chen",
    role: "Co-Founder & CEO",
    bio: "Former Stanford AI researcher with 10+ years in educational technology. PhD in Machine Learning from MIT.",
    image: "/placeholder.svg?height=300&width=300",
    skills: ["AI Strategy", "Product Vision", "EdTech"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Marcus Rodriguez",
    role: "Co-Founder & CTO",
    bio: "Full-stack engineer and AI specialist. Previously led engineering teams at Google and Microsoft.",
    image: "/placeholder.svg?height=300&width=300",
    skills: ["AI Engineering", "System Architecture", "RAG Pipelines"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Dr. Emily Watson",
    role: "Head of AI Research",
    bio: "NLP expert specializing in educational content analysis. Former researcher at OpenAI and DeepMind.",
    image: "/placeholder.svg?height=300&width=300",
    skills: ["NLP", "Content Analysis", "Model Training"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "James Park",
    role: "Lead Frontend Engineer",
    bio: "UI/UX specialist with expertise in React and modern web technologies. Former Apple design team member.",
    image: "/placeholder.svg?height=300&width=300",
    skills: ["React", "UI/UX Design", "TypeScript"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Dr. Aisha Patel",
    role: "Education Specialist",
    bio: "Former university professor and curriculum designer. Expert in learning assessment and pedagogical methods.",
    image: "/placeholder.svg?height=300&width=300",
    skills: ["Curriculum Design", "Assessment", "Pedagogy"],
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Alex Thompson",
    role: "DevOps Engineer",
    bio: "Infrastructure and security specialist ensuring our platform scales reliably and securely.",
    image: "/placeholder.svg?height=300&width=300",
    skills: ["AWS", "Security", "Scalability"],
    social: {
      linkedin: "#",
      github: "#",
    },
  },
]

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">Meet Our Team</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're a passionate group of educators, engineers, and researchers dedicated to revolutionizing learning
              through AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800"
              >
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      className="w-32 h-32 rounded-full mx-auto object-cover"
                    />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{member.name}</h3>

                  <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">{member.role}</p>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">{member.bio}</p>

                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {member.skills.map((skill, skillIndex) => (
                      <Badge
                        key={skillIndex}
                        variant="secondary"
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-center space-x-4">
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {member.social.github && (
                      <a
                        href={member.social.github}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Join Our Mission</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center max-w-3xl mx-auto mb-8">
              We're always looking for talented individuals who share our passion for education and technology. If
              you're interested in making a meaningful impact on how people learn, we'd love to hear from you.
            </p>
            <div className="text-center">
              <a
                href="mailto:careers@quizgen.ai"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
              >
                View Open Positions
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}