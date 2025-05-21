import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Documentation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <nav className="bg-card rounded-lg border overflow-hidden sticky top-[76px]">
            <div className="p-4">
              <div className="relative mb-4">
                <input
                  type="search"
                  placeholder="Search docs..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Getting Started</h3>
                  <div className="space-y-1">
                    <button className="w-full text-left px-3 py-2 rounded-md text-sm bg-primary/10 text-primary">
                      Introduction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Introduction to Ward Cleaning</h2>
              
              <p>
                Welcome to the Ward Cleaning documentation. This app helps wards, branches, and
                stakes organize meetinghouse cleaning and share assignments with their members.
                Here you&rsquo;ll find guides for every feature and tips for keeping the Lord&rsquo;s
                buildings ready for worship.
              </p>

              <p>
                "Reverence for the Lord's House Service and sacrifice help us grow in faith and
                gain appreciation for what is sacred. Actions throughout the week can make our
                cleaning efforts more effective. For example, ward councils can help by moving from
                the foyers distracting items like posters and easels to other areas in the
                meetinghouses. This can help keep our focus on worshiping the Savior, as shown by
                the artwork in the foyers. Watch this video to learn about the growth others have
                experienced as they&rsquo;ve cleaned and cared for meetinghouses."
              </p>
              
              <h3>Our Mission</h3>
              
              <p>
                Our mission is to maintain a clean, safe, and welcoming environment for all ward members
                and visitors. Through organized volunteer efforts, we ensure that our building remains
                in excellent condition for worship services, activities, and community events.
              </p>
              
              <h3>Getting Started</h3>
              
              <p>
                New to ward cleaning duties? Here's what you need to know:
              </p>
              
              <ul>
                <li>
                  <strong>Sign Up:</strong> Use the Schedule page to view available cleaning assignments and sign up for time slots that work for you.
                </li>
                <li>
                  <strong>Check In:</strong> When you arrive for your assignment, check in with the team lead or mark your attendance in the app.
                </li>
                <li>
                  <strong>Follow Procedures:</strong> Each area has specific cleaning procedures outlined in this documentation.
                </li>
                <li>
                  <strong>Report Issues:</strong> If you notice any maintenance issues or supply shortages, report them through the app.
                </li>
                <li>
                  <strong>Track Hours:</strong> Your contributions are automatically logged when you complete assignments.
                </li>
              </ul>
              
              <h3>Using This Documentation</h3>
              
              <p>
                This documentation is organized into several sections:
              </p>
              
              <ul>
                <li>
                  <strong>Getting Started:</strong> Basic information for new volunteers.
                </li>
                <li>
                  <strong>Cleaning Procedures:</strong> Detailed guidelines for cleaning different areas.
                </li>
                <li>
                  <strong>Equipment Usage:</strong> Instructions for using cleaning tools and equipment.
                </li>
                <li>
                  <strong>Administrative:</strong> Information for team leaders and coordinators.
                </li>
              </ul>

              <h3>Available Tools</h3>

              <p>
                The Ward Cleaning App offers several tools to help you stay organized and keep
                members informed.
              </p>

              <h4>Messenger</h4>
              <p>
                Send personalized SMS reminders to members about upcoming assignments. Filter
                contacts by group or focus on those who haven&rsquo;t registered yet.
              </p>

              <h4>Campaigns</h4>
              <p>
                Create reusable message templates with tokens for names, groups, and schedules.
                These templates appear in Messenger so you can communicate quickly.
              </p>

              <h4>Contacts</h4>
              <p>
                View imported ward members and mark anyone who prefers not to be contacted. This
                list powers other tools like Messenger and Schedule.
              </p>

              <h4>Schedule</h4>
              <p>
                Build cleaning calendars, assign groups to each Saturday, and view the schedule as
                a list or calendar.
              </p>

              <h4>Reporting (Coming Soon)</h4>
              <p>
                A future dashboard will summarize volunteer hours, participation, and other key
                statistics.
              </p>

              <h4>Tools</h4>
              <p>
                Use the Ward Contact Import to bring in member data from churchofjesuschrist.org
                and the Task Builder to customize cleaning tasks for your building.
              </p>

              <h4>Settings</h4>
              <p>
                Manage your profile and ward or branch details here. Additional settings like
                notifications will be added over time.
              </p>
              
              <div className="bg-muted p-4 rounded-md my-6">
                <h4 className="mt-0">Need Help?</h4>
                <p className="mb-0">
                  If you have questions or need assistance, please contact the ward cleaning coordinator through the <Link href="/app/messenger" className="text-primary hover:underline">Messenger</Link> or refer to the <Link href="/app/contacts" className="text-primary hover:underline">Contacts</Link> page.
                </p>
              </div>
              
              <h3>Next Steps</h3>
              
              <p>
                Now that you're familiar with the basics, we recommend exploring the following resources:
              </p>
              
              <ul>
                <li>Review the <span className="text-primary cursor-pointer">Member Onboarding</span> guide for detailed training information</li>
                <li>Check out <span className="text-primary cursor-pointer">First Assignment</span> for tips on completing your first cleaning task</li>
                <li>Browse the <span className="text-primary cursor-pointer">Cleaning Procedures</span> section for specific area guidelines</li>
              </ul>
              
              <p>
                Thank you for your willingness to serve and help maintain our building!
              </p>
            </div>
            
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <div></div>
              <div>
                <button className="flex items-center gap-2 text-primary hover:underline">
                  Member Onboarding
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-medium mb-4">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {[
                { 
                  question: 'How long are typical cleaning assignments?',
                  answer: 'Most cleaning assignments range from 1-2 hours, depending on the area and tasks involved.'
                },
                { 
                  question: 'What should I wear for cleaning assignments?',
                  answer: 'Comfortable, casual clothing and closed-toe shoes are recommended. For some tasks, gloves will be provided.'
                },
                { 
                  question: 'Can I bring my children to help with cleaning?',
                  answer: 'Yes, children are welcome to help under adult supervision. There are many age-appropriate tasks they can assist with.'
                },
                { 
                  question: 'What if I need to cancel my assignment?',
                  answer: 'Please notify your team leader as soon as possible through the Messenger feature, or reschedule directly in the app.'
                }
              ].map((item, i) => (
                <div key={i} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <h3 className="font-medium mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button className="text-primary hover:underline text-sm">View All FAQs</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 