average_rating is required but also allowed to be null. For a brand-new candidate with 0 reviews, what does this field actually return — null or 0?
user on the review submission has no auth attached to it anywhere in the spec. Can anyone type any name into user, or is identity checked some other way?
Nothing stops one person from submitting multiple reviews for the same candidate. Is that allowed, or should there be a one-review-per-user rule?
There's no endpoint to edit or delete a review after it's submitted. Is that intentional, or missing from the contract?
text on a review has no max length. Can it be any size, or should there be a character limit?