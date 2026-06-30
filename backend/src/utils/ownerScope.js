export function ownerFilter(userId) {
  return { userId };
}

export function assertDocumentOwner(doc, userId) {
  if (!doc || doc.userId?.toString() !== userId.toString()) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }
}
