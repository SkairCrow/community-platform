// This is basically an identical set of steps to the discussion tests for
// projects, research and news. Any changes here should be replicated there.

import { MOCK_DATA } from '../../data'
import { generateNewUserDetails } from '../../utils/TestUtils'

describe('[Questions.Discussions]', () => {
  it('shows existing comments', () => {
    const question = MOCK_DATA.questions[0]
    cy.visit(`/questions/${question.slug}`)
    cy.get(`[data-cy=comment-text]`).contains('First comment')
    cy.get('[data-cy=show-replies]').click()
    cy.get(`[data-cy="ReplyItem"]`).contains('First Reply')
  })

  it('allows authenticated users to contribute to discussions', () => {
    const visitor = generateNewUserDetails()
    const question = MOCK_DATA.questions[2]

    const newComment = `An interesting question. The answer must be... ${visitor.username}`
    const updatedNewComment = `An interesting question. The answer must be that when the sky is red, the apocalypse _might_ be on the way. Love, ${visitor.username}`
    const newReply = `Thanks Dave and Ben. What does everyone else think? - ${visitor.username}`
    const updatedNewReply = `Anyone else? Your truly ${visitor.username}`
    const questionPath = `/questions/${question.slug}`

    cy.signUpNewUser(visitor)

    cy.step("Can't add comment with an incomplete profile")
    cy.visit(questionPath)
    cy.get('[data-cy=comments-form]').should('not.exist')
    cy.get('[data-cy=comments-incomplete-profile-prompt]').should('be.visible')

    cy.step('Can add comment when profile is complete')
    cy.completeUserProfile(visitor.username)
    cy.visit(questionPath)
    cy.contains('Start the discussion')
    cy.get('[data-cy=comments-incomplete-profile-prompt]').should('not.exist')
    cy.addComment(newComment)
    cy.contains('1 Comment')

    cy.step('Can edit their comment')
    cy.editDiscussionItem('CommentItem', newComment, updatedNewComment)

    cy.step('Another user can add reply')
    const secondCommentor = generateNewUserDetails()
    cy.logout()
    cy.signUpCompletedUser(secondCommentor)
    cy.visit(questionPath)
    cy.addReply(newReply)
    cy.wait(1000)
    cy.contains('Comments')

    cy.step('Can edit their reply')
    cy.editDiscussionItem('ReplyItem', newReply, updatedNewReply)
    cy.step('Another user can leave a reply')
    const secondReply = `Quick reply. ${visitor.username}`

    cy.step('First commentor can respond')
    cy.logout()
    cy.signIn(visitor.email, visitor.password)

    cy.step('Notification generated for reply')

    cy.expectNewNotification({
      content: updatedNewReply,
      path: questionPath,
      title: question.title,
      username: secondCommentor.username,
    })

    cy.visit(questionPath)
    cy.expectNoNewNotifications()

    cy.addReply(secondReply)

    cy.step('Can delete their comment')
    cy.deleteDiscussionItem('CommentItem', updatedNewComment)

    cy.step('Replies still show for deleted comments')
    cy.get('[data-cy="deletedComment"]').should('be.visible')
    cy.get('[data-cy=OwnReplyItem]').contains(secondReply)

    cy.step('Can delete their reply')
    cy.deleteDiscussionItem('ReplyItem', secondReply)
  })
})
