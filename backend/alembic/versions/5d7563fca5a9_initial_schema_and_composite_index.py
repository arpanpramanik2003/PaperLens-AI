"""initial_schema_and_composite_index

Revision ID: 5d7563fca5a9
Revises: 
Create Date: 2026-08-10 01:23:17.728586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5d7563fca5a9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index('idx_activities_user_action', 'activities', ['user_id', 'action_type'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_activities_user_action', table_name='activities')
