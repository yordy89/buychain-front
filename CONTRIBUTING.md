# Contribution Guidelines

## Have one commit per logical change and one major feature per pull request

When submitting a pull request, all the commits associated with that pull request should be related to the same major feature( enhancement, bug fix, maintenance). For example, if you made the follow changes:

1) Fixed bug #1234
2) Implemented new feature discussed during the last call

Those should be two separate pull requests. 

On the other hand, if you have instead made these changes:

- Wrote new feature discussed at last planning session
- Wrote documentation for new feature
- Wrote tests for new feature

Those could all be made part of the same pull request.

Within your pull request, there should be a single commit for each logical change. For example rather than:

- Started documentation for new feature
- Made changes to documentation based on review
- Reformatted documentation to fix syntax error

You should have a single commit:

- Write documentation for new feature

You can use `git commit --amend` or `git rebase` to organize commit message appropriately.


## Make your commit messages meaningful

In general, this means:

- Your commit message should succinctly describe _what was changed_ and _why it was changed_.

- Your commit message should have the subject on the first line, then a blank line, then the message body(optional), blank line then referenced issues or ids(optional).

- The message and body should be wrapped at around 75 characters.

### Example of bad commit messages

1) `minor fix`, `fix bugs`, `fix of fix`

2) `Work on xxx feature`

3) `issue-1234`

### Example of good commit messages

1) 
```
support new Description field on Company form

Update both the entity model and the web UI to support an extended
"description" field on all objects. This allows us to generate more useful notes.

See more: #1456, #1234
```

2) 

```
move Transaction delete button from header row to body

To support tablet device screens, actions column (together with other secondary columns) moved to footers actions row.

Related: #1234, #4321
```


## Splitting up changes into commits

The important rule for creating good commits is to ensure there is only one "logical change" per commit. There are many reasons why this is an important rule:


- When browsing history, small well defined changes help to reason and understand exactly where and why a piece of code came from.

- If a change is found to be inaccurate later, it may be necessary to revert the broken commit. This is much easier to do if there are not other unrelated code changes mixed up with the original commit.

- It's quicker & easier to review & identify potential mistakes.