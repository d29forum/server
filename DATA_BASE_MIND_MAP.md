##USER
 id (primary key)
 
 first_name
 
 last_name
 
 email
 
 userName
 
 interests
 
 joined (date/time)
 
 gravatar (all gravatar api required fields)
 
 total-posts
 
 title: (role aka admin user)
 
 last-login

##SUB-FORUM
 id (primary key)
 
 title
 
 sub-title (blurb)
 
 threadcount
 
 postcount
 
 last-post


##THREAD
 id (primary key)
 
 title
 
 post-count
 
 view-count
 
 last-post
 
 createdOn (date/time)
 
 user_id (foreign key)
 
 sub-forum_id (foreign key)

##POST
 id (primary key)
 
 content
 
 createdOn (date/time)
 
 thread_id (foreign key)
 
 user_id (foreign key)
 
 sub-forum_id (foreign key)

