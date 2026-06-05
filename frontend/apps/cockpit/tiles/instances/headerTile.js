// tiles/instances/HeaderTile.js

import { LargeTile } from "../templates/LargeTile.js";

export function HeaderTile(state) {
    return LargeTile({
        title: "System Status",
        sections: [
            {
                label: "Breadcrumbs",
                content: state.breadcrumbs
            },
            {
                label: "Datum",
                content: new Date().toLocaleDateString()
            }
        ]
    });
}
