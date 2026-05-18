"""add username to users

Revision ID: n6o7p8q9r0s1
Revises: m4n5o6p7q8r9
Create Date: 2026-05-18
"""
from alembic import op

revision = 'n6o7p8q9r0s1'
down_revision = 'm4n5o6p7q8r9'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)")


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_users_username")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS username")
