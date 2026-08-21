THIS IS TEAM 12
  Ashley Natasha-Docs/DevOps lead
  Ivy Chepkoech-Intergration/QA lead
  Tonybrian Korir-Backend Devs
  Jeremy Akanle-API lead

SUMMARY OF THE APP
   AccessMap Nairobi is a 100% frontend web application that helps people with disabilities and their carers find accessible venues across Nairobi. Users can search for hospitals, markets, schools, banks, and malls — and instantly see whether each venue has ramps, lifts, accessible toilets, accessible parking, and more.
   All data is community-powered — anyone can submit a report in under two minutes.
PART B AUDIT
 RESOURCE 1-VENUES
Things stored:
1.id, slug, name, area, address, category, accessibility features (8 boolean fields), coordinates, addedAt, isSeeded
Actions a user can take:
1.View all venues (browse the directory)
2.View a single venue (venue detail page)
3.Create a new venue (via the report form)
4.Search venues by name, area or category
5.Filter venues by area, accessibility features, and minimum rating
6.Sort venues by most recent, highest rated, most reports, alphabetical
7.Get directions to a venue (Google Maps link)
8.Print a venue page

RESOURCE 2-REPORTS
Things stored:
1.id, venueId, rating (1-5), description, visitedAt, submittedAt, accessibility features observed (8 boolean fields)
Actions a user can take:
1.View all reports for a venue
2.Create a new report for a venue
3.View average rating for a venue (computed from reports)

RING POSITION
 We are team 12 thus we will consume from team 11 and team 13 will consume from us

https://github.com/natasherr/accessmap-nairobi-api