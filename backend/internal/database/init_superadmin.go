package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

// EnsureSuperAdminAndSchema guarantees that the thinkerstone admin user and required schema constraints are in place.
func (db *DB) EnsureSuperAdminAndSchema(ctx context.Context) error {
	// 1. Update Attendance Status Check Constraint to include SAKIT if not present
	alterStatusConstraint := `
		DO $$ 
		BEGIN 
			ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
			ALTER TABLE attendance ADD CONSTRAINT attendance_status_check 
				CHECK (status IN ('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA', 'BELUM_HADIR'));
		EXCEPTION
			WHEN OTHERS THEN NULL;
		END $$;
	`
	if _, err := db.ExecContext(ctx, alterStatusConstraint); err != nil {
		log.Printf("[InitDB] Warning updating attendance_status_check constraint: %v", err)
	}

	// 2. Ensure user_id column exists on attendance table and intern_id is nullable
	alterAttendanceCols := `
		DO $$ 
		BEGIN 
			-- Add user_id column to attendance if not exists
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'attendance' AND column_name = 'user_id'
			) THEN
				ALTER TABLE attendance ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
				CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
			END IF;

			-- Make intern_id nullable if it was NOT NULL
			ALTER TABLE attendance ALTER COLUMN intern_id DROP NOT NULL;
		EXCEPTION
			WHEN OTHERS THEN NULL;
		END $$;
	`
	if _, err := db.ExecContext(ctx, alterAttendanceCols); err != nil {
		log.Printf("[InitDB] Warning altering attendance columns: %v", err)
	}

	// 3. Backfill user_id for existing attendance records from interns table
	backfillQuery := `
		UPDATE attendance a
		SET user_id = i.user_id
		FROM interns i
		WHERE a.intern_id = i.id AND a.user_id IS NULL;
	`
	if _, err := db.ExecContext(ctx, backfillQuery); err != nil {
		log.Printf("[InitDB] Warning backfilling attendance user_id: %v", err)
	}

	// 4. Upsert Super Admin user: thinkerstone (password: stone!23)
	hash, err := bcrypt.GenerateFromPassword([]byte("stone!23"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash superadmin password: %w", err)
	}

	var existingID string
	checkQuery := `
		SELECT id FROM users 
		WHERE LOWER(email) = LOWER('thinkerstone@bps.go.id') 
		   OR LOWER(email) = LOWER('thinkerstone')
		   OR LOWER(name) = LOWER('thinkerstone')
		LIMIT 1
	`
	err = db.QueryRowContext(ctx, checkQuery).Scan(&existingID)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("[InitDB] Warning checking superadmin user: %v", err)
	}

	if err == sql.ErrNoRows || existingID == "" {
		insertQuery := `
			INSERT INTO users (name, email, password_hash, role)
			VALUES ('thinkerstone', 'thinkerstone@bps.go.id', $1, 'admin')
		`
		if _, err := db.ExecContext(ctx, insertQuery, string(hash)); err != nil {
			return fmt.Errorf("failed to insert superadmin thinkerstone: %w", err)
		}
		log.Println("[InitDB] ✓ Super Admin user 'thinkerstone' created successfully!")
	} else {
		updateQuery := `
			UPDATE users 
			SET password_hash = $1, role = 'admin', updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
		`
		if _, err := db.ExecContext(ctx, updateQuery, string(hash), existingID); err != nil {
			log.Printf("[InitDB] Warning updating superadmin password: %v", err)
		} else {
			log.Println("[InitDB] ✓ Super Admin user 'thinkerstone' password synced.")
		}
	}

	return nil
}
