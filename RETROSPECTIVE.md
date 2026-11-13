# Week 14 Retrospective

## 1. The hardest part of the lifecycle: Integrate

Integration was the hardest stage for our team. The main reason was that we did
not have a dependable, direct connection to the upstream VoterEdu service from
the start. We had to ask the partner team to provide an additional resource
that would make our application useful, and our integration depended on their
live API URL, which could be slow. This made it difficult to tell whether a
failure came from our backend, a partner response, deployment configuration, or
the network. A request that worked locally was not automatically proof that
the deployed integration was working.

The dependency mattered to the product, not just the demo. Our intended flow
lets a person with a disability send accessibility feedback that reaches
VoterEdu and can inform future rally planning. That gives the venue
accessibility information a path to affect future events. To make this
integration more reliable, I worked on the backend, partner URL and
authentication issues, and stale-data behavior. The resilience work added
bounded retries and last-known-good data rather than assuming the live partner
would always respond quickly. The experience taught me that partner
availability and a clearly agreed resource are design constraints that should
be addressed early, not left until deployment.

## 2. One real cross-team issue

The partner test results document a concrete contract mismatch found by Group
13 on October 19, 2026. Their request
`GET /api/venues?accessible=not-a-boolean` returned `200 OK`, even though the
documented behavior expected `400 Bad Request` for an invalid boolean filter.
This was important because a partner could send a malformed filter and receive
a success-shaped response instead of being told what was wrong. The issue was
identified by testing our deployed API against the contract, rather than by
assuming that a successful normal request proved the filter was validated.

The recorded team response was to add a validation guard to the
`GET /api/venues` handler in `server/routes/venues.js`. It rejects values other
than `true` and `false` before querying the database; the partner test report
records the result changing from 200 to 400 while valid filter values continued
to work. My responsibility was backend and database integration, and I also
worked through backend configuration and integration bugs. The project notes
do not record who authored that specific guard or its exact turnaround time,
so I will not claim that I alone implemented it. In my experience, some
cross-dependent fixes took close to a day because of Git/versioning conflicts.
We should have recorded the time and ownership for this particular fix while
resolving it.

## 3. What I would design differently

I would make the database and migration approach an early team decision. We
spent effort rebuilding the project to use SQL in a way that matched the lab
expectations after having gone down a Prisma migration path. I would confirm
the lab’s required approach before implementation, then document the agreed
schema and migration workflow so the frontend and backend could develop
against the same assumptions. I would also make our needs statement more
customer-focused: describe the specific accessibility problem, who experiences
it, and how partner feedback changes what happens next. That would help us
prioritize useful features over implementation details.

I would keep the feedback connection to VoterEdu and the resilience approach.
They make the integration valuable to users and acknowledge that partner
services can be unavailable. I would also keep contract tests with partner
examples, but run them earlier and after each relevant change. The work exposed
unfinished checks too: our resilience notes say the connection-refused drill
was not run, and the browser-based visual check remained a manual follow-up.
I would schedule those checks as part of integration rather than treating a
passing build as the final proof.

## 4. My contribution

I rate my contribution **9 out of 10**. I was the database engineer and worked
to make the backend support the frontend as required. My work included database
integration, changing the project from the Prisma migration approach to SQL,
and documenting the blind test and stale-data work. I also worked on the flaky
partner setup, fixed backend integration problems such as a missing API key
and incorrect partner URL, and helped deploy the API to Render with Jeremy’s
help setting up the environment.

I tested authentication and found that the version deployed from a teammate’s
GitHub work was missing the integration portion. We had to recover the project
version and deploy again before the integration succeeded. That experience
showed me that I was willing to investigate a problem across the deployed
backend, not just my database tasks, but it also showed where our version
coordination was weak. I did not do everything alone: teammates supported the
authentication work and helped create automated tests when tests were failing
or behaving unexpectedly. Jeremy helped with the Render environment. I rate
myself highly because I owned substantial backend and database work and
followed deployment issues through, but not a 10 because testing and version
coordination needed more consistent teamwork and earlier planning.
