"""add certificate image_url

Revision ID: m4n5o6p7q8r9
Revises: l3m4n5o6p7q8
Create Date: 2026-05-17
"""
from alembic import op

revision = 'm4n5o6p7q8r9'
down_revision = 'l3m4n5o6p7q8'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE certificates ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)")


def downgrade():
    op.execute("ALTER TABLE certificates DROP COLUMN IF EXISTS image_url")
