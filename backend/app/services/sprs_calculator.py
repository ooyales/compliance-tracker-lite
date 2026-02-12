from app.models.control import Control


class SPRSCalculator:
    """
    SPRS (Supplier Performance Risk System) Score Calculator.

    The SPRS score starts at 110 and subtracts points for unmet controls.
    Each control has a weight (1, 3, or 5 points).
    - implemented: 0 points deducted
    - partially_implemented: half weight deducted (rounded up)
    - planned: full weight deducted
    - not_implemented: full weight deducted
    - not_applicable: 0 deducted
    - not_assessed: 0 deducted
    Score range: -203 to +110
    """

    BASE_SCORE = 110

    @staticmethod
    def calculate(controls=None, session_id='__default__'):
        """Calculate the SPRS score from the current control states."""
        if controls is None:
            controls = Control.query.filter_by(session_id=session_id).all()

        total_deduction = 0

        for control in controls:
            weight = control.weight or 1
            status = control.implementation_status or 'not_assessed'

            if status == 'implemented':
                deduction = 0
            elif status == 'partially_implemented':
                deduction = -(-weight // 2)  # ceiling division
            elif status in ('planned', 'not_implemented'):
                deduction = weight
            else:
                # not_applicable, not_assessed
                deduction = 0

            total_deduction += deduction

        return SPRSCalculator.BASE_SCORE - total_deduction

    @staticmethod
    def get_breakdown(controls=None, session_id='__default__'):
        """Return detailed breakdown of score deductions per control."""
        if controls is None:
            controls = Control.query.filter_by(session_id=session_id).all()

        breakdown = []
        total_deduction = 0

        for control in controls:
            weight = control.weight or 1
            status = control.implementation_status or 'not_assessed'

            if status == 'implemented':
                deduction = 0
            elif status == 'partially_implemented':
                deduction = -(-weight // 2)
            elif status in ('planned', 'not_implemented'):
                deduction = weight
            else:
                deduction = 0

            total_deduction += deduction
            breakdown.append({
                'control_number': control.control_number,
                'title': control.title,
                'status': status,
                'weight': weight,
                'deduction': deduction,
            })

        return {
            'base_score': SPRSCalculator.BASE_SCORE,
            'total_deduction': total_deduction,
            'sprs_score': SPRSCalculator.BASE_SCORE - total_deduction,
            'controls': breakdown,
        }
