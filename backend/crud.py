from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from fastapi import HTTPException, status

def check_overlap(orig_a_idx: int, dest_a_idx: int, orig_b_idx: int, dest_b_idx: int) -> bool:
    # Segments overlap iff max(orig1, orig2) < min(dest1, dest2)
    start_a, end_a = sorted([orig_a_idx, dest_a_idx])
    start_b, end_b = sorted([orig_b_idx, dest_b_idx])
    return max(start_a, start_b) < min(end_a, end_b)